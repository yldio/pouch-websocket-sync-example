import { combineReducers } from 'redux'
import todos from './todos'
import syncState from './syncState'

export default combineReducers({
  todos, syncState
})
