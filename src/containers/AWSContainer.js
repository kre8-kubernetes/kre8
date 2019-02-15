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
    this.state = {
      createRole_roleName: '',
      createRole_description: '',
      createTechStack_stackName: '',
      createCluster_clusterName: '',
    }
    this.handleChange = this.handleChange.bind(this);

    this.handleCreateRole = this.handleCreateRole.bind(this);
    this.handleNewRole = this.handleNewRole.bind(this);

    this.handleCreateTechStack = this.handleCreateTechStack.bind(this);
    this.handleNewTechStack = this.handleNewTechStack.bind(this);

    this.handleCreateCluster = this.handleCreateCluster.bind(this);
    this.handleNewCluster = this.handleNewCluster.bind(this);

    this.emitInstallAuthenticator = this.emitInstallAuthenticator.bind(this);
    this.confirmInstallAuthenticator = this.confirmInstallAuthenticator.bind(this);
  }

  handleChange(e) {
    e.preventDefault();
    this.setState({ [e.target.name]: e.target.value })
  }

  // On component mount we will create listeners, so that the main thread can communicate when needed
  componentDidMount() {
    ipcRenderer.on(events.CONFIRM_IAM_AUTHENTICATOR_INSTALLED, this.confirmInstallAuthenticator)
    ipcRenderer.on(events.HANDLE_NEW_ROLE, this.handleNewRole)
    ipcRenderer.on(events.HANDLE_NEW_TECH_STACK, this.handleNewTechStack)
    ipcRenderer.on(events.HANDLE_NEW_CLUSTER, this.handleNewCluster)
  }

  // On component unmount, we will unsubscribe to listeners
  componentWillUnmount() {
    ipcRenderer.removeListener(events.CONFIRM_IAM_AUTHENTICATOR_INSTALLED, this.confirmInstallAuthenticator);
    ipcRenderer.removeListener(events.HANDLE_NEW_ROLE, this.handleNewRole);
    ipcRenderer.removeListener(events.HANDLE_NEW_TECH_STACK, this.handleNewTechStack);
    ipcRenderer.removeListener(events.HANDLE_NEW_CLUSTER, this.handleNewCluster);
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
      roleName: this.state.createRole_roleName,
      description: this.state.createRole_description,
    }
    ipcRenderer.send(events.CREATE_IAM_ROLE, awsIAMRoleData);
  }

  handleNewRole(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming text:', data);
    this.props.setNewRole(data);
  }

  //** --------- CREATE TECH STACK --------------------------------- **//
  handleCreateTechStack(data) {
    console.log('createTechStack Clicked!!!');
    //TODO Dynamically intake data from form
    const awsTechStackData = {
      stackName: this.state.createTechStack_stackName,
    }
    ipcRenderer.send(events.CREATE_TECH_STACK, awsTechStackData);
  }

  handleNewTechStack(event, data) {
    console.log('incoming text:', data);
    //TODO: this.props.SOMETHING(data);
  }

  //** --------- CREATE AWS CLUSTER ------------------------------------- **//
  handleCreateCluster(data) {
    console.log('handleCreateCluster Clicked!!!');
    //TODO Dynamically intake data from form
    const awsClusterData = {
      clusterName: this.state.createCluster_clusterName,
    }
    ipcRenderer.send(events.CREATE_CLUSTER, awsClusterData);
  }

  handleNewCluster(event, data) {
    console.log('incoming data from cluster:', data);
    //TODO: this.props.SOMETHING(data);
  }

  render() {
    const { 
      createRole_roleName,
      createRole_description,
      createTechStack_stackName,
      createCluster_clusterName,
     } = this.state;

    return (
      <div>
        <AWSTestComponent
          handleChange={this.handleChange}

          createRole_roleName={createRole_roleName}
          createRole_description={createRole_description}
          createTechStack_stackName={createTechStack_stackName}
          createCluster_clusterName={createCluster_clusterName}

          emitInstallAuthenticator={this.emitInstallAuthenticator}
          handleCreateTechStack={this.handleCreateTechStack}
          handleCreateCluster={this.handleCreateCluster}
        />
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));