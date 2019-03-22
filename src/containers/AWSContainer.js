import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { Switch, Route, withRouter } from 'react-router-dom';
import SimpleReactValidator from 'simple-react-validator';

import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import AWSComponent from '../components/AWSComponent'
import AWSLoadingComponent from '../components/AWSLoadingComponent'
import HelpInfoComponent from '../components/HelpInfoComponent';


//**-------------- REDUX -----------------------------------**//

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
      awsComponentSubmitted: false,

      iamRoleStatus: 'CREATING',
      stackStatus:'—',
      clusterStatus:'—',
      workerNodeStatus: '—',
      kubectlConfigStatus: '—',
      errorMessage: '',

      text_info: '',
      showInfo: false,
      mouseCoords: {}
    }

    this.validator = new SimpleReactValidator({
      element: (message, className) => <div className="errorClass">{message}</div>
    });

    this.handleChange = this.handleChange.bind(this);

    this.handleStatusChange = this.handleStatusChange.bind(this);
    this.handleError = this.handleError.bind(this);

    this.handleConfigAndMakeNodes = this.handleConfigAndMakeNodes.bind(this);
    this.handleNewNodes = this.handleNewNodes.bind(this);

    this.testFormValidation = this.testFormValidation.bind(this);

    this.displayInfoHandler = this.displayInfoHandler.bind(this);
    this.hideInfoHandler = this.hideInfoHandler.bind(this);
  }



  //**-------------- COMPONENT LIFECYCLE METHODS -----------------**//

  //Once component mounts, activate listeners, to receive data from AWS regarding the cluster creation process
  componentDidMount() {
    ipcRenderer.on(events.HANDLE_STATUS_CHANGE, this.handleStatusChange);
    ipcRenderer.on(events.HANDLE_ERRORS, this.handleError);
    ipcRenderer.on(events.HANDLE_NEW_NODES, this.handleNewNodes);
  }

  // On component unmount, unsubscribe to listeners
  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_STATUS_CHANGE, this.handleStatusChange);
    ipcRenderer.removeListener(events.HANDLE_ERRORS, this.handleError);
    ipcRenderer.removeListener(events.HANDLE_NEW_NODES, this.handleNewNodes);
  }

  //**--------------EVENT HANDLERS-----------------**//
  handleChange(e) {
    e.preventDefault();
    this.setState({ [e.target.id]: e.target.value });
  }

  testFormValidation() {
    if (this.validator.allValid()) {
      return true;
    } else {
      this.validator.showMessages();
      this.forceUpdate();
      return false;
    }
  }

  // Handlers to trigger events that will take place in the main thread

  //** --------- CONFIGURE CLUSTER + KUBECTL, TRIGGERED WHEN USER SUBMITS CLUSTER DATA ----------- **//
  handleConfigAndMakeNodes(e) {
    e.preventDefault();

    console.log('Submit Clicked!!! State:', this.state);

    const clusterData = {
        iamRoleName: this.state.iamRoleName,
        vpcStackName: this.state.vpcStackName,
        clusterName: this.state.clusterName, 
    }

    console.log("clusterdata:", clusterData);
  
    if (this.testFormValidation()) {
      console.log("All form data passed validation");
      console.log('data to send!!', this.state);

      ipcRenderer.send(events.CREATE_CLUSTER, clusterData);
      this.setState({ ...this.state, awsComponentSubmitted: true});

    } else {
      console.log("Invalid or missing data entry");
    }
  }
  
  //Activated after last step in cluster creation process is complete. If kubectl is successfully configured:
  handleNewNodes(event, data) {
    console.log('kubectl has been configured and worker nodes have been made from the main thread:', data);
    this.props.history.push('/cluster');
  }

    //** --------- CREATING CLUSTER, TRIGGERED AS AWS SENDS STATUS & ERROR DATA BACK -------- **//

    handleStatusChange(event, data) {
      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!data", data)
      console.log("data.type: ", data.type);
      console.log("data.status: ", data.status);
      console.log("state before: ", this.state);
  
      this.setState({ ...this.state, [data.type]: data.status});
      console.log("state after: ", this.state);
    }
  
    handleError(event, data) {
      console.log("state from error: ", this.state);
      console.log("data", data)
      console.log("error message: ", data.type)
      console.log("error message: ", data.status)
      console.log("error message: ", data.errorMessage)
  
  
      this.setState({ 
        ...this.state, 
        [data.type]: data.status,
        errorMessage: data.errorMessage,
      }),
      console.log("state after error: ", this.state);
    }

  //** --------- More Info Component -------------- **//
  displayInfoHandler(e){
    const aws_info = 'Amazon Web Services Elastic Container Service for Kubernetes (EKS) Account Setup. Your Identity and Access Management (IAM) Role for EKS is the AWS identity that will have specific permissions to create and manage your Kubernetes Cluster. For the Role Name, select something that will easily identify the role’s purpose. Example: unique-EKS-Management-Role. Your AWS VPC Stack represents a collection of resources necessary to manage and run your Kubernetes cluster. For the Stack Name, select something that will easily identify the stack’s purpose. Example: unique-EKS-Stack. An EKS Cluster consists of two primary components: The Amazon EKS control plane and Amazon EKS worker nodes that run the Kubernetes etcd and the Kubernetes API server. For the Cluster Name, select something that will easily identify the stack’s purpose. Example: unique-EKS-Cluster. Once submitted, this phase takes 10-15 minutes to complete, depending on Amazon’s processing time. Kre8 cannot proceed until your EKS Account has been set up.'

    const x = e.screenX;
    const y = e.screenY;
    const newCoords = {top: y, left: x}
    this.setState({...this.state, text_info: aws_info, mouseCoords: newCoords, showInfo: true})
  }

  //HIDE INFO BUTTON CLICK HANDLER
  hideInfoHandler(){
    this.setState({...this.state, showInfo: false})
  }
  
  render() {
    const { 
      iamRoleName,
      vpcStackName,
      clusterName,

      iamRoleStatus,
      stackStatus,
      clusterStatus,
      workerNodeStatus,
      kubectlConfigStatus,
      errorMessage
     } = this.state;

    return (
      <div className="aws_cluster_page_container">
        {this.state.showInfo === true && (
        <HelpInfoComponent 
          text_info={this.state.text_info}
          hideInfoHandler={this.hideInfoHandler}
          mouseCoords={this.state.mouseCoords}
        />
        )}

        {this.state.awsComponentSubmitted === false && (
          <AWSComponent 
            text_info={this.state.text_info}
            hideInfoHandler={this.hideInfoHandler}
            mouseCoords={this.state.mouseCoords}
            handleChange={this.handleChange}
            validator={this.validator}         

            iamRoleName={iamRoleName}
            vpcStackName={vpcStackName}
            clusterName={clusterName}
      
            handleConfigAndMakeNodes={this.handleConfigAndMakeNodes}
            displayInfoHandler={this.displayInfoHandler}
            grabCoords={this.grabCoords}
            /> 
          )}

        {this.state.awsComponentSubmitted === true && (
        <AWSLoadingComponent
          handleChange={this.handleChange}
          iamRoleName={iamRoleName}
          vpcStackName={vpcStackName}
          clusterName={clusterName}

          iamRoleStatus={iamRoleStatus}
          stackStatus={stackStatus}
          clusterStatus={clusterStatus}
          workerNodeStatus={workerNodeStatus}
          kubectlConfigStatus={kubectlConfigStatus}
          errorMessage={errorMessage}  
          /> 
        )}
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AwsContainer));

    {/* handleCreateRole={this.handleCreateRole} 
          emitInstallAuthenticator={this.emitInstallAuthenticator}
          handleCreateTechStack={this.handleCreateTechStack}
          handleCreateCluster={this.handleCreateCluster} */}