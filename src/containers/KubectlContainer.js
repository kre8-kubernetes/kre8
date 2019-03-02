import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import TreeGraphContainer from './TreeGraphContainer.js';

import CreateMenuItemContainer from './CreateMenuItemContainer'

const mapStateToProps = store => ({
  showCreateMenuItem: store.navbar.showCreateMenuItem,
});

const mapDispatchToProps = dispatch => ({

});

class KubectlContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {

    }
  }

  //**--------------COMPONENT LIFECYCLE METHODS-----------------**//
  
  // DEPLOYMENT LIFECYCLE METHOD
  componentDidMount() {

  }
  
  // On component unmount, we will unsubscribe to listeners
  componentWillUnmount() {

  }

  //**--------------EVENT HANDLERS-----------------**//

  render() {
    return (
      <div className='kubectl_container'>
        {this.props.showCreateMenuItem === true && (
          <CreateMenuItemContainer />
        )}
        <TreeGraphContainer />
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(KubectlContainer))