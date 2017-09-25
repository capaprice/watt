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
  call,
  take,
} from 'redux-saga/effects';

import { IConnectOptions } from './actions';
import { ESTABLISH_CONNECTION } from './constants';

function connect(options: IConnectOptions) {
  const ws = new WebSocket(options.url, options.protocols);
  ws.onopen = () => options.onconnect(ws);
  // There's no detail information on connection error.
  // See https://stackoverflow.com/questions/18803971/websocket-onerror-how-to-read-error-description.
  ws.onerror = () => options.onerror();
}

export function* websocketSaga() {
  while (true) {
    const action = yield take(ESTABLISH_CONNECTION);
    yield call(connect, action.payload);
  }
}
