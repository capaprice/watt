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

import {
  Dispatch,
  Middleware,
  MiddlewareAPI,
} from 'redux';

import terminalManager from '../lib/TerminalManager';

import { WRITE_DATA } from '../components/Terminal';

const writeTerminalMiddleware: Middleware =
  <S>({getState}: MiddlewareAPI<S>) =>
    (next: Dispatch<S>) =>
      (action: any) => {
        if (action.type === WRITE_DATA) {
          const term = terminalManager.getTerminal(action.payload.termName);
          if (term) {
            term.write(action.payload.data);
          }
        }
        return next(action);
      };

export default writeTerminalMiddleware;
