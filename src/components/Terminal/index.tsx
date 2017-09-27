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

import * as React from 'react';

import terminalManager from '../../lib/TerminalManager';
import injectEncodingTranslationRenderLayer from './injectEncodingTranslationRenderLayer';

import { Terminal as XTerm } from 'xterm';

// Load xterm.css and skip CSS module.
import '!style-loader!css-loader!xterm/lib/xterm.css';

export interface ITerminalProps {
  // This is an unique name that can be used to uniquely identify the xterm's Terminal among others.
  // After the Terminal component gets mounted, you can find the xterm's Terminal object with this
  // name from TerminalManager.
  termName: string;
  // Focus the terminal after it gets instantiated in the DOM. (default: true)
  focus?: boolean;
  // Set the width (default: 100vw) and height (default: 100vh) of the terminal.
  height?: string;
  width?: string;
  // Set how cursor looks like. Valid values are 'block', 'underline' and 'bar'. Default is
  // 'underline'.
  cursorStyle?: 'block' | 'underline' | 'bar';
  // Whether the terminal cursor blinks (default: true)
  cursorBlink?: boolean;
  // Charset encoding of the contents written to the terminal
  charset: string;
}

export class Terminal extends React.Component<ITerminalProps, {}> {
  public refs: {
    container: HTMLDivElement;
  };

  private _term: Nullable<XTerm>;

  constructor(props?: ITerminalProps, context?: any) {
    super(props, context);
    // Load addons.
    XTerm.loadAddon('fit');
  }

  public componentDidMount() {
    const {
      charset,
      cursorBlink = true,
      cursorStyle = 'underline',
      focus = true,
      termName,
    } = this.props;
    this._term = new XTerm({
      cursorBlink,
      cursorStyle,
      ...this.guessInitialGeometry(),
    });
    this._term.setOption('termName', termName);

    // Bind term instance with the container.
    this._term.open(this.refs.container);
    if (focus) {
      this._term.focus();
    }

    // Inject character encoding translation layer in rederer.
    injectEncodingTranslationRenderLayer(this._term, charset);

    // This will resize the terminal to fit the container size.
    (this._term as any).fit();

    // Register this._terminal.
    terminalManager.registerTerminal(this._term);
  }

  public componentWillUnmount() {
    if (this._term) {
      terminalManager.unregisterTerminal(this._term);
      this._term.destroy();
      this._term = null;
    }
  }

  public render() {
    const { height = '100vh', width = '100vw' } = this.props;
    return (<div ref="container" style={{height, width}}></div>);
  }

  // guessInitialGeometry determine the size of terminal window on instantiating a XTerm.
  private guessInitialGeometry() {
    // This is a workaround for https://github.com/sourcelair/xterm.js/issues/661.
    //
    // The initial size can be any value as long as it is larger than the container size. Otherwise
    // the terminal is broken after calling fit(). See
    // https://github.com/sourcelair/xterm.js/issues/661#issuecomment-320789397
    return {
      cols: 1000,
      rows: 1000,
    };
  }
}

export * from './constants';
export * from './actions';
