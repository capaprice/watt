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

// Constants defined by Telnet protocol (RFC854)
const SE                = 240;
const NOP               = 241;
const DATA_MARK         = 242;
const BREAK             = 243;
const INTERRUPT_PROCESS = 244;
const ABORT_OUTPUT      = 245;
const ARE_YOU_THERE     = 246;
const ERASE_CHARACTER   = 247;
const ERASE_LINE        = 248;
const GO_AHEAD          = 249;
const SB                = 250;
const WILL              = 251;
const WONT              = 252;
const DO                = 253;
const DONT              = 254;
const IAC               = 255;

const IAC_BUFFER_SIZE = 64;

class IACBuffer {
  private _buffer: Uint8Array;
  private _size: number;

  constructor() {
    this._buffer = new Uint8Array(IAC_BUFFER_SIZE);
    this._size = 0;
  }

  public start() {
    this._buffer[0] = IAC;
    this._size = 1;
  }

  // Push a byte to the buffer. Return true if the buffer contains a complete IAC command after
  // the push.
  public push(b: number): boolean {
    if (this._size < this._buffer.length) {
      this._buffer[this._size++] = b;
    }
    if ((this._size === 3) && (this._buffer[1] !== SB)) {
      // SB indicates that what follows is subnegotiation of the indicated option.
      return true;
    } else if (b === SE) {
      // SE indicates the end of subnegotiation parameters.
      return true;
    }
    return false;
  }

  // Return true if there's any full or partial IAC command in the buffer.
  public empty(): boolean {
    return this._size === 0;
  }

  public take(): Uint8Array {
    const ret = this._buffer.slice(0, this._size);
    this._size = 0;
    return ret;
  }
}

interface ITelnetServer {
  write: (data: ArrayBuffer) => void;
}

// tslint:disable:max-classes-per-file
export default class TelnetClient {
  // Temporary buffer to store partial IAC commands; Note that data could be sent to this client in
  // chunks so we need to preserve the state across round of onmessage().
  private _iacBuf: IACBuffer;
  // The terminal object that renders the received data on the screen
  private _xterm: XTerm;
  // The server to send back user inputs received from the terminal
  private _server: ITelnetServer;

  constructor() {
    this._iacBuf = new IACBuffer();
  }

  // Attach xterm's Terminal to display data and connect the server to send user input.
  public attach(xterm: XTerm, server: ITelnetServer) {
    this._xterm = xterm;
    this._server = server;
  }

  // Process data and apply changes on terminal.
  public onmessage(data: ArrayBuffer) {
    const view = new Uint8Array(data);

    let i = 0;
    while (i < view.length) {
      if (!this._iacBuf.empty()) {
        // We have a partial IAC command in buffer. Consume the byte and see if we get the full one.
        if (this._iacBuf.push(view[i])) {
          this.processIAC(this._iacBuf.take());
        }
        ++i;
      } else if (view[i] === IAC) {
        if (this._iacBuf.empty()) {
          this._iacBuf.start();
        } else {
          // ???
        }
        ++i;
      } else {
        // This is a normal text. Send data to terminal directly before the next IAC.
        const offset = i++;
        while (i < view.length) {
          if (view[i] === IAC) {
            break;
          }
          ++i;
        }
        const bytes = view.slice(offset, i);
        this._xterm.write(String.fromCharCode.apply(null, bytes));
      }
    }  // while (i < view.length)
  }

  private processIAC(data: Uint8Array) {
    // data is guaranteed to have at least 3 bytes.

    const IS = 0;
    const SEND = 1;
    const TERMINAL_TYPE = 24;
    const NAWS = 31;

    switch (data[1]) {
      case SB: {
        if (data[2] === TERMINAL_TYPE) {
          if ((data.length >= 4) && (data[3] === SEND)) {
            const ret = new Uint8Array([
              IAC,
              SB,
              TERMINAL_TYPE,
              IS,
              'x'.charCodeAt(0),
              't'.charCodeAt(0),
              'e'.charCodeAt(0),
              'r'.charCodeAt(0),
              'm'.charCodeAt(0),
              '-'.charCodeAt(0),
              '2'.charCodeAt(0),
              '5'.charCodeAt(0),
              '6'.charCodeAt(0),
              'c'.charCodeAt(0),
              'o'.charCodeAt(0),
              'l'.charCodeAt(0),
              'o'.charCodeAt(0),
              'r'.charCodeAt(0),
              IAC,
              SE,
            ]);
            this._server.write(ret.buffer);
          }
        }
        break;
      }
      case WILL: {
        const ECHO = 1;
        const SUPRESS_GO_AHEAD = 3;

        const option = data[2];
        const ret = new Uint8Array([IAC, 0, option]);
        if ((option === ECHO) || (option === SUPRESS_GO_AHEAD)) {
          ret[1] = DO;
        } else {
          ret[1] = DONT;
        }
        this._server.write(ret.buffer);
        break;
      }
      case DO: {
        const option = data[2];
        const ret = new Uint8Array([IAC, 0, option]);
        switch (option) {
          case TERMINAL_TYPE: {
            ret[1] = WILL;
            this._server.write(ret.buffer);
            break;
          }
          case NAWS: {
            ret[1] = WILL;
            this._server.write(ret.buffer);
            const naws = new Uint8Array([
              IAC,
              SB,
              NAWS,
              0,
              this._xterm.cols,
              0,
              this._xterm.rows,
              IAC,
              SE,
            ]);
            this._server.write(naws.buffer);
            break;
          }
          default: {
            ret[1] = WONT;
            this._server.write(ret.buffer);
            break;
          }
        }
        return;
      }
      case WONT:
      case DONT:
      default: {
        return;
      }
    }
  }
}
