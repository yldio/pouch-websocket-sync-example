import React, { PropTypes, Component } from 'react'
import classnames from 'classnames'
import { SHOW_ALL, SHOW_COMPLETED, SHOW_ACTIVE } from '../constants/TodoFilters'

class SyncStatus extends Component {

  render() {
    const { text } = this.props.status
    return (
      <p style={{padding: "1em"}}>
        syncStatus: {text}
      </p>
    )
  }
}

export default SyncStatus
