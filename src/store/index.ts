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

import createSagaMiddleware from 'redux-saga';

import {
  applyMiddleware,
  compose,
  createStore,
  Store,
} from 'redux';

import rootReducer from './reducers';
import rootSaga from './sagas';
import IRootState from './state';

import {
  logger as loggerMiddleware,
  writeTerminal as writeTerminalMiddleware,
} from '../middleware';

export function configureStore(initialState?: IRootState): Store<IRootState> {
  const isProduction = (process.env.NODE_ENV === 'production');
  const sagaMiddleware = createSagaMiddleware();

  // Create the store with the following middlewares:
  //
  //  - sagaMiddleware: Makes redux-sagas work
  //  - writeTerminalMiddleware: Write data to Terminal component
  const middlewares = [
    sagaMiddleware,
    writeTerminalMiddleware,
  ];

  // Append logger middelware to emit every action sent to store.
  if (!isProduction) {
    middlewares.push(loggerMiddleware);
  }

  const enhancers = [
    applyMiddleware(...middlewares),
  ];

  // If Redux DevTools Extension is installed use it, otherwise use Redux compose.
  const composeEnhancers =
    process.env.NODE_ENV !== 'production' &&
    typeof window === 'object' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
      window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose;

  const store = createStore(
    rootReducer,
    initialState,
    composeEnhancers(...enhancers),
  ) as Store<IRootState>;

  // Start redux-saga.
  sagaMiddleware.run(rootSaga);

  // Make reducers hot reloadable, see http://mxs.is/googmo.
  if (module.hot) {
    module.hot.accept('./reducers', () => {
      const nextReducer = require('./reducers');
      store.replaceReducer(nextReducer);
    });
  }

  return store;
}
