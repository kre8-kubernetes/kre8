import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { Switch, Route, withRouter } from 'react-router-dom';
import SimpleReactValidator from 'simple-react-validator';

import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import AWSComponent from '../components/AWSComponent'

//TODO: Create logic for form data sanitation, ie don't accept an empty field from a user when they click submit

const mapStateToProps = store => ({
  roleName: store.aws.roleName,
  podName: store.kubectl.podName
});

const mapDispatchToProps = dispatch => ({
  setNewRole: (text) => {
    dispatch(actions.setRole(text))
  }
});

class AwsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      createRole_roleName: '',
      createRole_description: '',
      createTechStack_stackName: '',
      createCluster_clusterName: '',
    }

    this.validator = new SimpleReactValidator({
      element: (message, className) => <div className="errorClass">{message}</div>
    });

    this.handleChange = this.handleChange.bind(this);

    this.handleCreateRole = this.handleCreateRole.bind(this);
    this.handleNewRole = this.handleNewRole.bind(this);

    this.handleCreateTechStack = this.handleCreateTechStack.bind(this);
    this.handleNewTechStack = this.handleNewTechStack.bind(this);

    this.handleCreateCluster = this.handleCreateCluster.bind(this);
    this.handleNewCluster = this.handleNewCluster.bind(this);

    this.emitInstallAuthenticator = this.emitInstallAuthenticator.bind(this);
    this.confirmInstallAuthenticator = this.confirmInstallAuthenticator.bind(this);

    this.handleConfigAndMakeNodes = this.handleConfigAndMakeNodes.bind(this);
    this.handleNewNodes = this.handleNewNodes.bind(this);

    this.testFormValidation = this.testFormValidation.bind(this);
  }



  //**--------------COMPONENT LIFECYCLE METHODS-----------------**//

  // On component mount we will create listeners, so that the main thread can communicate when needed
  componentDidMount() {
    ipcRenderer.on(events.CONFIRM_IAM_AUTHENTICATOR_INSTALLED, this.confirmInstallAuthenticator);
    ipcRenderer.on(events.HANDLE_NEW_ROLE, this.handleNewRole);
    ipcRenderer.on(events.HANDLE_NEW_TECH_STACK, this.handleNewTechStack);
    ipcRenderer.on(events.HANDLE_NEW_CLUSTER, this.handleNewCluster);
    ipcRenderer.on(events.HANDLE_NEW_NODES, this.handleNewNodes);
  }

  // On component unmount, we will unsubscribe to listeners
  componentWillUnmount() {
    ipcRenderer.removeListener(events.CONFIRM_IAM_AUTHENTICATOR_INSTALLED, this.confirmInstallAuthenticator);
    ipcRenderer.removeListener(events.HANDLE_NEW_ROLE, this.handleNewRole);
    ipcRenderer.removeListener(events.HANDLE_NEW_TECH_STACK, this.handleNewTechStack);
    ipcRenderer.removeListener(events.HANDLE_NEW_CLUSTER, this.handleNewCluster);
    ipcRenderer.removeListener(events.HANDLE_NEW_NODES, this.handleNewNodes);
  }

  //**--------------EVENT HANDLERS-----------------**//
  handleChange(e) {
    e.preventDefault();
    this.setState({ [e.target.name]: e.target.value });
  }

  testFormValidation() {
    if (this.validator.allValid()) {
      alert('Your pod is being created!');
      return true;
    } else {
      this.validator.showMessages();
      this.forceUpdate();
      return false;
    }
  }

  // Handlers to trigger events that will take place in the main thread
  //TODO: delete this one 
  //** ------- INSTALL AWS IAM AUTHENTICATOR FOR EKS ---------- **//
  emitInstallAuthenticator(e) {
    e.preventDefault();
    console.log('authenticator installed!!!');
    ipcRenderer.send(events.INSTALL_IAM_AUTHENTICATOR, 'hello');
  }

  confirmInstallAuthenticator(event, data) {
    console.log("Data from confirmInstallAuthenticator: ", data);
  }

  //** --------- CREATE AWS IAM ROLE FOR EKS --------------------- **//
  handleCreateRole(e) {
    e.preventDefault();
    console.log('handleCreateRole Clicked!!!');
    const awsIAMRoleData = {
      roleName: this.state.createRole_roleName,
      description: this.state.createRole_description,
    }

    if (this.testFormValidation()) {
      console.log("All form data passed validation");
      this.setState({ ...this.state, createRole_roleName: '', createRole_description: ''})
      ipcRenderer.send(events.CREATE_IAM_ROLE, awsIAMRoleData);
    } else {
      console.log("Invalid or missing data entry");
    }
  }

  handleNewRole(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming text:', data);
    // this.props.setNewRole(data);
  }
  
  //** --------- CREATE TECH STACK --------------------------------- **//
  handleCreateTechStack(e) {
    e.preventDefault();
    console.log('createTechStack Clicked!!!');
    //TODO: Dynamically intake data from form
    const awsTechStackData = {
      stackName: this.state.createTechStack_stackName,
    }

    if (this.testFormValidation()) {
      console.log("All form data passed validation");
      this.setState({ ...this.state, createTechStack_stackName: ''});
      ipcRenderer.send(events.CREATE_TECH_STACK, awsTechStackData);
    } else {
      console.log("Invalid or missing data entry");
    }
  }
  
  handleNewTechStack(event, data) {
    console.log('incoming text:', data);
    //TODO: this.props.SOMETHING(data);
  }
  
  //** --------- CREATE AWS CLUSTER ------------------------------------- **//
  handleCreateCluster(e) {
    e.preventDefault();
    console.log('handleCreateCluster Clicked!!!');

    //TODO: Dynamically intake data from form
    const awsClusterData = {
      clusterName: this.state.createCluster_clusterName,
    }

    if (this.testFormValidation()) {
      console.log("All form data passed validation");
      this.setState({ ...this.state, createCluster_clusterName: ''});
      ipcRenderer.send(events.CREATE_CLUSTER, awsClusterData);
    } else {
      console.log("Invalid or missing data entry");
    }  
  }
  
  handleNewCluster(event, data) {
    console.log('incoming data from cluster:', data);
    //TODO: this.props.SOMETHING(data);
  }
  
  //TODO: Remove this portion, no longer relevant
  //** --------- Config Kubectl and Create Worker Nodes -------------- **//
  handleConfigAndMakeNodes(e) {
    e.preventDefault();
    console.log('clicked handleConfigAndMakeNodes');
    ipcRenderer.send(events.CONFIG_KUBECTL_AND_MAKE_NODES, 'from config kubectl and make worker nodes');
  }

  handleNewNodes(event, data) {
    console.log('kubectl has been configured and worker nodes have been made from the main thread:', data);
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
      <div className="aws_cluster_page_background"></div>

      <div className="aws_cluster_page_container">
        <AWSComponent
          handleChange={this.handleChange}
          validator={this.validator}         

          createRole_roleName={createRole_roleName}
          createRole_description={createRole_description}
          createTechStack_stackName={createTechStack_stackName}
          createCluster_clusterName={createCluster_clusterName}

          handleCreateRole={this.handleCreateRole}
          emitInstallAuthenticator={this.emitInstallAuthenticator}
          handleCreateTechStack={this.handleCreateTechStack}
          handleCreateCluster={this.handleCreateCluster}
          handleConfigAndMakeNodes={this.handleConfigAndMakeNodes}
        />
      </div>
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AwsContainer));