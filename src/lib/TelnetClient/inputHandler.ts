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

import { ITelnetServer } from './interfaces';

export default class InputHandler {
  private readonly _server: ITelnetServer;
  private readonly _xterm: XTerm;

  constructor(server: ITelnetServer, xterm: XTerm) {
    this._server = server;
    this._xterm = xterm;
  }

  public handle(key: string, e: KeyboardEvent) {
    this._server.write(Buffer.from(key).buffer);
  }
}
