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
    this.emitInstallAuthenticator = this.emitInstallAuthenticator.bind(this);
    this.confirmInstallAuthenticator = this.confirmInstallAuthenticator.bind(this);
  }

  // On component mount we will create listeners, so that the main thread can communicate when needed
  componentDidMount() {
    ipcRenderer.on(events.HANDLE_NEW_ROLE, this.handleNewRole)
    ipcRenderer.on(events.CONFIRM_IAM_AUTHENTICATOR_INSTALLED, this.confirmInstallAuthenticator)

  }

  // On component unmount, we will unsubscribe to listeners
  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_NEW_ROLE, this.handleNewRole);
    ipcRenderer.removeListener(events.CONFIRM_IAM_AUTHENTICATOR_INSTALLED, this.confirmInstallAuthenticator);
    
  }

  // Handlers to trigger events that will take place in the main thread
  

  //** ------- INSTALL AWS IAM AUTHENTICATOR FOR EKS ---------- **//
  emitInstallAuthenticator(data) {
    console.log('authenticator installed!!!');
    ipcRenderer.send(events.INSTALL_IAM_AUTHENTICATOR, 'hello');
  }

  confirmInstallAuthenticator(event, data) {
    console.log("Data from confirmInstallAuthenticator: ", data);
  }

  //** --------- CREATE AWS IAM ROLE FOR EKS --------------------- **//
  handleCreateRole(data) {
    console.log('handleCreateRole Clicked!!!');
    //TODO Dynamically intake data from form
    const awsIAMRoleData = {
      roleName: 'take',
      description: 'take IAM Role'
    }
    ipcRenderer.send(events.CREATE_IAM_ROLE, awsIAMRoleData);
  }

  handleNewRole(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming text:', data);
    this.props.setNewRole(data);
  }

  render() {
    return (
      <div>
        <AWSTestComponent
          roleName={this.props.roleName}
          handleCreateRole={this.handleCreateRole}
          emitInstallAuthenticator={this.emitInstallAuthenticator}
        />
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));