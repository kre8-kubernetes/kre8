import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { Switch, Route, withRouter } from 'react-router-dom';
import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import AWSTestComponent from '../components/AWSTestComponent'

const mapStateToProps = store => ({
  roleName: store.aws.roleName,
  podName: store.kubectl.podName
});

const mapDispatchToProps = dispatch => ({
  setNewRole: (text) => {
    dispatch(actions.setRole(text))
  }
});

class App extends Component {
  constructor(props) {
    super(props);
    this.handleCreateRole = this.handleCreateRole.bind(this);
    this.handleNewRole = this.handleNewRole.bind(this);
  }

  // On component mount we will create listeners, so that the main thread can communicate when needed
  componentDidMount() {
    ipcRenderer.on(events.HANDLE_NEW_ROLE, this.handleNewRole)
  }

  // On component unmount, we will unsubscribe to listeners
  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_NEW_ROLE, this.handleNewRole);
  }

  // Handlers to trigger events that will take place in the main thread
  handleCreateRole(data) {
    console.log('handleCreateRole Clicked!!!');
    ipcRenderer.send(events.CREATE_IAM_ROLE, 'hello');
  }

  handleNewRole(event, text) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming text:', text);
    this.props.setNewRole(text);
  }

  render() {
    return (
      <div>
        <AWSTestComponent
          roleName={this.props.roleName}
          handleCreateRole={this.handleCreateRole}
        />
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));