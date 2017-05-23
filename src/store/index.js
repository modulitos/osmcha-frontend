// @flow
import {combineReducers, createStore, applyMiddleware} from 'redux';
import {createLogger} from 'redux-logger';
import {Map, Iterable} from 'immutable';
import {routerReducer, routerMiddleware} from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';
import createSagaMiddleware from 'redux-saga';

import * as safeStorage from '../utils/safe_storage';

// Reducers
import {authReducer} from './auth_reducer';
import {changesetsPageReducer} from './changesets_page_reducer';
import {changesetReducer} from './changeset_reducer';

import type {ChangesetsPageType} from './changesets_page_reducer';
import type {ChangesetType} from './changeset_reducer';
import type {AuthType} from './auth_reducer';

// Sages
import sagas from './sagas';

export type RootStateType = {
  auth: AuthType,
  changesetsPage: ChangesetsPageType,
  changeset: ChangesetType,
  routing: Object,
};

// Root reducer
const reducers = combineReducers({
  changesetsPage: changesetsPageReducer,
  changeset: changesetReducer,
  routing: routerReducer,
  auth: authReducer,
});

const history = createHistory();
const sagaMiddleware = createSagaMiddleware();
// Middlewares
const middlewares = [sagaMiddleware, routerMiddleware(history)];

const stateTransformer = state => {
  if (Iterable.isIterable(state)) return state.toJS();
  else return state;
};

if (process.env.NODE_ENV !== 'production') {
  const logger = createLogger({
    stateTransformer: state => {
      let newState = {};

      for (var i of Object.keys(state)) {
        if (Iterable.isIterable(state[i])) {
          newState[i] = state[i].toJS();
        } else {
          newState[i] = state[i];
        }
      }
      return newState;
    },
  });
  middlewares.push(logger);
}

// Persisted state
const persistedState = {
  auth: Map({
    token: safeStorage.getItem('token'),
    oAuthToken: safeStorage.getItem('oauth_token'),
    oAuthTokenSecret: safeStorage.getItem('oauth_token_secret'),
    error: null,
  }),
};

// Store
const store = createStore(
  reducers,
  persistedState,
  applyMiddleware(...middlewares),
);

// Persist change to local storage
store.subscribe(() => {
  // const {user} = store.getState();
  // const token = user.get('token');
  // if (token !== safeStorage.getItem('token')) {
  //   safeStorage.setItem('token', token);
  // }
});

sagaMiddleware.run(sagas);

export {store, history};
