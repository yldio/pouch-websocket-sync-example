import * as types from '../constants/ActionTypes'
import PouchMiddleware from '../middlewares/pouch'
import { createStore, applyMiddleware } from 'redux'
import rootReducer from '../reducers'
import PouchDB from 'pouchdb'
import PouchRemoteStream from 'pouch-remote-stream'
import WebsocketStream from 'websocket-stream'
import JsonDuplexStream from 'json-duplex-stream';

PouchDB.adapter('remote', PouchRemoteStream.adapter);

export default function configureStore() {
  var db = new PouchDB('todos');
  var ws = WebsocketStream('ws://localhost:3001');
  var remote = PouchRemoteStream();
  var remoteDB = new PouchDB('todos-server', {
    adapter: 'remote',
    remote
  });

  PouchDB.sync(db, remoteDB, {live: true});

  var json = JsonDuplexStream();
  ws.
    pipe(json.in).
    pipe(remote.stream).
    pipe(json.out).
    pipe(ws);

  const pouchMiddleware = PouchMiddleware({
    path: '/todos',
    db,
    actions: {
      remove: doc => store.dispatch({type: types.DELETE_TODO, id: doc._id}),
      insert: doc => store.dispatch({type: types.INSERT_TODO, todo: doc}),
      update: doc => store.dispatch({type: types.UPDATE_TODO, todo: doc}),
    }
  })
  const createStoreWithMiddleware = applyMiddleware(pouchMiddleware)(createStore)
  const store = createStoreWithMiddleware(rootReducer)

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextReducer = require('../reducers')
      store.replaceReducer(nextReducer)
    })
  }

  return store
}
