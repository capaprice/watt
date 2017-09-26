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

// This makes accesses to the internal data structures in xterm.js easily. They are currently
// used by EncodingTranslationRenderLayer.

declare module 'xterm/lib/Buffer' {
  export const CHAR_DATA_ATTR_INDEX = 0;
  export const CHAR_DATA_CHAR_INDEX = 1;
  export const CHAR_DATA_WIDTH_INDEX = 2;
  export const CHAR_DATA_CODE_INDEX = 3;
}

declare module 'xterm/lib/Types' {
  export type CharData = [number, string, number, number];
}

declare module 'xterm/lib/renderer/BaseRenderLayer' {
  export class BaseRenderLayer {
    constructor(
      container: HTMLElement,
      id: string,
      zIndex: number,
      alpha: boolean,
      colors: any
    );

    public resize(terminal: any, dim: any, charSizeChanged: boolean): void;

    protected clearAll(): void;
  }
}

declare module 'xterm/lib/renderer/GridCache' {
  export class GridCache<T> {
    public cache: T[][];
    constructor();
    public resize(width: number, height: number): void;
    public clear(): void;
  }
}
