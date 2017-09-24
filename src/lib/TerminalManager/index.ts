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

import { Terminal as XTerm } from 'xterm';

class TerminalManager {
  private _xterms: { [name: string]: Nullable<XTerm>; } = {};

  public getTerminal(name: string): Nullable<XTerm> {
    return this._xterms[name];
  }

  public registerTerminal(xterm: XTerm) {
    this._xterms[xterm.getOption('termName')] = xterm;
  }

  public unregisterTerminal(xterm: XTerm) {
    this._xterms[xterm.getOption('termName')] = null;
  }
}

// terminalManager is a singleton object that holds all xterm's Terminal. This allows direct access
// to the Terminal object of given id to perform actions (such as write data to terminal). It maps
// each Terminal to its name (via xterm.getOption('termName')) to allow later lookup.
const terminalManager = new TerminalManager();

export default terminalManager;
