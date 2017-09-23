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

import { Terminal as XTerm } from 'xterm';

// Load xterm.css and skip CSS module.
import '!style-loader!css-loader!xterm/lib/xterm.css';

export interface ITerminalProps {
  // Focus the terminal after it gets instantiated in the DOM. (default: true)
  focus?: boolean;
  // Set the width (default: 100vw) and height (default: 100vh) of the terminal.
  height?: string;
  width?: string;
  // Whether the terminal cursor blinks (default: true)
  cursorBlink?: boolean;
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
    const { cursorBlink = true, focus = true } = this.props;
    this._term = new XTerm({
      cursorBlink,
      ...this.guessInitialGeometry(),
    });
    // Bind term instance with the container.
    this._term.open(this.refs.container);
    if (focus) {
      this._term.focus();
    }

    // This will resize the terminal to fit the container size.
    (this._term as any).fit();
    this._term.write('Hello, World!');
  }

  public componentWillUnmount() {
    if (this._term) {
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
