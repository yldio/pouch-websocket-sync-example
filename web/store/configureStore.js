import * as types from '../constants/ActionTypes'
import PouchMiddleware from '../middlewares/pouch'
import { createStore, applyMiddleware } from 'redux'
import rootReducer from '../reducers'
import PouchDB from 'pouchdb'
import PouchRemoteStream from 'pouch-remote-stream'
import WebsocketStream from 'websocket-stream'
import Reconnect from 'reconnect-core'
import PipeChannels from 'pipe-channels'

PouchDB.adapter('remote', PouchRemoteStream.adapter);

export default function configureStore() {
  var db = new PouchDB('todos');

  var reconnect = Reconnect(function(address) {
    return WebsocketStream(address);
  });

  var re = reconnect(function(ws) {

    var client = PipeChannels.createClient();
    ws.pipe(client).pipe(ws);

    client.channel('todos-server', function(err, channel) {
      if (err) throw err;

      const remote = PouchRemoteStream();
      const remoteDB = new PouchDB('todos-server', {
        adapter: 'remote',
        remote
      });

      const sync = PouchDB.sync(db, remoteDB, {live: true});
      channel.pipe(remote.stream).pipe(channel);

      channel.once('end', function() {
        sync.cancel()
      });
    });

  }).
  on('error', function(err) {
    console.log(err);
  }).
  connect('ws://localhost:3001');

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
