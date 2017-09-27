/*
 * Copyright (C) 2017-present Capaprice Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as iconv from 'iconv-lite';

import { Terminal as XTerm } from 'xterm';
import {
  CHAR_DATA_ATTR_INDEX,
  CHAR_DATA_CHAR_INDEX,
  CHAR_DATA_CODE_INDEX,
  CHAR_DATA_WIDTH_INDEX,
} from 'xterm/lib/Buffer';
import { BaseRenderLayer } from 'xterm/lib/renderer/BaseRenderLayer';
import { GridCache } from 'xterm/lib/renderer/GridCache';
import { CharData } from 'xterm/lib/Types';

class EncodingTranslationRenderLayer extends BaseRenderLayer {
  // state avoids double-translation on the contents that have been processed before.
  private _state: GridCache<Nullable<CharData>>;
  // The charaction encoding to translate from
  private _charset: string;

  constructor(container: HTMLElement, zIndex: number, colors: any, charset: string) {
    super(container, 'encoding_translation', zIndex, true, colors);
    this._state = new GridCache<Nullable<CharData>>();
    this._charset = charset;
  }

  public resize(terminal: XTerm, dim: any, charSizeChanged: boolean) {
    super.resize(terminal, dim, charSizeChanged);
    this._state.clear();
    this._state.resize(terminal.cols, terminal.rows);
  }

  public onGridChanged(terminal: XTerm, startRow: number, endRow: number) {
    // Resize has not been called yet.
    if (this._state.cache.length === 0) {
      return;
    }

    const terminalBuffer = (terminal as any).buffer;
    const cols = terminal.cols;
    const ydisp = terminalBuffer.ydisp;
    const lines = terminalBuffer.lines;

    for (let y = startRow; y <= endRow; ++y) {
      const row = y + ydisp;
      const line = lines.get(row);

      for (let x = 0; x < cols; ++x) {
        const charData1 = line[x] as CharData;
        const ch1 = charData1[CHAR_DATA_CHAR_INDEX];

        // The character to the left is a wide character, drawing is owned by the char at x-1.
        if (charData1[CHAR_DATA_WIDTH_INDEX] === 0) {
          this._state.cache[x][y] = null;
          continue;
        }

        // Skip rendering if the character is identical.
        const state = this._state.cache[x][y];
        if (state &&
            (state[CHAR_DATA_CHAR_INDEX] === ch1) &&
            (state[CHAR_DATA_ATTR_INDEX] === charData1[CHAR_DATA_ATTR_INDEX])) {
          // Skip rendering as contents are identical.
          this._state.cache[x][y] = charData1;
          continue;
        }

        if (ch1.charCodeAt(0) < 0x7f) {
          // Skip ASCII.
          this._state.cache[x][y] = charData1;
          continue;
        }

        if ((x + 1) >= cols) {
          // Skip translation when there's no subsequent byte.
          this._state.cache[x][y] = charData1;
          continue;
        }

        // Load the second byte.
        const charData2 = line[x + 1] as CharData;

        // Copy ch1 and ch2 data to a buffer to convert.
        const ch2 = charData2[CHAR_DATA_CHAR_INDEX];
        const convertBuf = new Buffer(ch1.length + ch2.length);
        for (let i = 0; i < ch1.length; ++i) {
          convertBuf[i] = ch1.charCodeAt(i);
        }
        for (let i = 0; i < ch2.length; ++i) {
          convertBuf[i + ch1.length] = ch2.charCodeAt(i);
        }

        // Convert to UTF-8.
        const u = iconv.decode(convertBuf, this._charset);

        if (u.length === 1) {
          // This is a normal word. Render the character at the position of the lead byte.
          charData1[CHAR_DATA_CODE_INDEX] = u.charCodeAt(0);
          charData1[CHAR_DATA_CHAR_INDEX] = u;
          charData1[CHAR_DATA_WIDTH_INDEX] = 1;
          // Render the continuation byte to a space.
          charData2[CHAR_DATA_CODE_INDEX] = 32;
          charData2[CHAR_DATA_CHAR_INDEX] = ' ';
          charData2[CHAR_DATA_WIDTH_INDEX] = 1;
          if (charData1[CHAR_DATA_ATTR_INDEX] !== charData2[CHAR_DATA_ATTR_INDEX]) {
            // TODO: Support "two-color" word for wide character.
          }
          // Update cache.
          this._state.cache[x][y] = charData1;
          this._state.cache[x + 1][y] = charData2;

          // Skip the continuation byte.
          ++x;
        } else {
          // Regard any non-single-codepoint result as invalid UTF-8 and skip the current byte.
          // Still update cache to avoid revisiting it.
          this._state.cache[x][y] = charData1;
        }
      }
    }
  }

  public reset(terminal: XTerm): void {
    this._state.clear();
    this.clearAll();
  }
}

export default function injectEncodingTranslationRenderLayer(terminal: XTerm, charset: string) {
  if (charset !== 'utf-8') {
    const renderer = (terminal as any).renderer;
    const layer = new EncodingTranslationRenderLayer(
      terminal.element,
      /* zIndex */-1,
      renderer.colorManager.colors,
      charset);
    renderer._renderLayers.unshift(layer);
  }
}
