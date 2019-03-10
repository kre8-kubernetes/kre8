import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { Switch, Route, withRouter } from 'react-router-dom';
import SimpleReactValidator from 'simple-react-validator';

import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import AWSComponent from '../components/AWSComponent'

const mapStateToProps = store => ({

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
      iamRoleName: '',
      vpcStackName: '',
      clusterName: '',
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
    this.setState({ [e.target.id]: e.target.value });
  }

  testFormValidation() {
    if (this.validator.allValid()) {
      //todo: convert alert
      alert('Your AWS Kubernetes Cluster is being configured');
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
      iamRoleName: this.state.iamRoleName,
      description: this.state.description,
    }

    if (this.testFormValidation()) {
      console.log("All form data passed validation");
      this.setState({ ...this.state, iamRoleName: '', description: ''})
      ipcRenderer.send(events.CREATE_IAM_ROLE, awsIAMRoleData);
    } else {
      console.log("Invalid or missing data entry");
    }
  }

  handleNewRole(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming text:', data);
    //TODO: Convert alert;
    alert(data);
    // this.props.setNewRole(data);
  }
  
  //** --------- CREATE TECH STACK --------------------------------- **//

  //TODO: DELETE Create tech stack logit and button
  handleCreateTechStack(e) {
    e.preventDefault();
    console.log('createTechStack Clicked!!!');
    //TODO: Dynamically intake data from form
    const awsTechStackData = {
      vpcStackName: this.state.vpcStackName,
    }

    if (this.testFormValidation()) {
      console.log("All form data passed validation");
      this.setState({ ...this.state, vpcStackName: ''});
      ipcRenderer.send(events.CREATE_TECH_STACK, awsTechStackData);
    } else {
      console.log("Invalid or missing data entry");
    }
  }
  
  handleNewTechStack(event, data) {
    console.log('incoming text:', data);
    alert(data)
    //TODO: this.props.SOMETHING(data);
  }
  
  //** --------- CREATE AWS CLUSTER ------------------------------------- **//
  handleCreateCluster(e) {
    e.preventDefault();
    console.log('handleCreateCluster Clicked!!!');

    //TODO: Dynamically intake data from form
    const awsClusterData = {
      clusterName: this.state.clusterName,
    }

    if (this.testFormValidation()) {
      console.log("All form data passed validation");
      this.setState({ ...this.state, clusterName: ''});
      erer.send(events.CREATE_CLUSTER, awsClusterData);
    } else {
      console.log("Invalid or missing data entry");
    }  
  }
  
  handleNewCluster(event, data) {
    console.log('incoming data from cluster:', data);
    //TODO: convert alert;
    alert(data);
  }
  
  //TODO: Remove this portion, no longer relevant
  //** --------- Config Kubectl and Create Worker Nodes -------------- **//
  handleConfigAndMakeNodes(e) {
    e.preventDefault();
    console.log('data to send!!', this.state);
    ipcRenderer.send(events.CREATE_IAM_ROLE, this.state);
  }

  handleNewNodes(event, data) {
    
    //TODO: convert alerts
    if (!data.includes('Not') && data.includes('Ready')) {
      this.props.history.push('/cluster');
      console.log('kubectl has been configured and worker nodes have been made from the main thread:', data);
      alert(`kubect configured successfully. Node status: ${data}`)
    } else {
      alert(`An error occurred while configuring kubectl: ${data}`);
    }
  }

  render() {
    const { 
      iamRoleName,
      vpcStackName,
      clusterName,
     } = this.state;

    return (
      <div>
        <div className="aws_cluster_page_container">
          <AWSComponent
            handleChange={this.handleChange}
            validator={this.validator}         

            iamRoleName={iamRoleName}
            vpcStackName={vpcStackName}
            clusterName={clusterName}

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