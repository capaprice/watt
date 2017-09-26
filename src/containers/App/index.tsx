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
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import {
  bindActionCreators,
  Dispatch,
} from 'redux';
import { v4 as uuid } from 'uuid';

import TelnetClient from '../../lib/TelnetClient';
import terminalManager from '../../lib/TerminalManager';

import {
  Terminal,
  writeData as writeTerminalData,
} from '../../components/Terminal';
import { connect as connectWebSocket } from '../../lib/WebSocketSaga';

declare interface IAppProps extends RouteComponentProps<void> {
  connectWebSocket: typeof connectWebSocket;
  writeTerminalData: typeof writeTerminalData;
}

class App extends React.Component<IAppProps, any> {
  private _telnetClient: TelnetClient = new TelnetClient();
  private _termName = uuid();

  public componentDidMount() {
    this.writeTerminal('Connecting to ptt.cc ... ');

    new Promise((resolve, reject) => {
      this.props.connectWebSocket({
        url: 'wss://ws.ptt.cc/bbs',
        protocols: ['telnet'],
        onconnect: resolve,
        onerror: reject,
      });
    }).then((ws: WebSocket) => this.attachTelnetClient(ws))
      .catch(() => this.writeTerminal('Failed'));
  }

  public render() {
    return <Terminal charset="big-5" termName={this._termName} />;
  }

  private writeTerminal(data: string) {
    this.props.writeTerminalData({
      termName: this._termName,
      data,
    });
  }

  private attachTelnetClient(ws: WebSocket) {
    this.writeTerminal('Succeeded!');

    const xterm = terminalManager.getTerminal(this._termName);
    if (!xterm) {
      return;
    }

    // Attach ...
    this._telnetClient.attach(xterm, { write: (data) => ws.send(data) });

    // Hand out data received from websocket to the telnet client.
    ws.onmessage = (e: MessageEvent) => {
      if (ws.binaryType === 'arraybuffer') {
        ws.onmessage(e.data);
      } else if (ws.binaryType === 'blob') {
        const reader = new FileReader();
        reader.onload = () => this._telnetClient.onmessage(reader.result);
        reader.readAsArrayBuffer(e.data);
      }
    };
  }
}

function mapDispatchToProps<S>(dispatch: Dispatch<S>) {
  return {
    connectWebSocket: bindActionCreators(connectWebSocket, dispatch),
    writeTerminalData: bindActionCreators(writeTerminalData, dispatch),
  };
}

export default connect(null, mapDispatchToProps)(App);
