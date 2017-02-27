import 'babel-core/polyfill'
import 'stream-browserify'  // import early to avoid 'stream' dependency cycle
import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import App from './containers/App'
import configureStore from './store/configureStore'
import 'todomvc-app-css/index.css'
import PouchDB from 'pouchdb'

const store = configureStore()

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
