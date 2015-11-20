import * as types from '../constants/ActionTypes'
import PouchMiddleware from '../middlewares/pouch'
import { createStore, applyMiddleware } from 'redux'
import rootReducer from '../reducers'
import PouchDB from 'pouchdb'

window.PouchDB = PouchDB;

export default function configureStore() {
  // const store = createStore(rootReducer)
  const pouchMiddleware = PouchMiddleware({
    path: '/todos',
    db: new PouchDB('todos'),
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
