import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { withRouter } from 'react-router-dom';

import * as yup from 'yup';

import * as actions from '../store/actions/actions';
import * as events from '../../eventTypes';

import AWSComponent from '../components/AWSComponent';
import AWSLoadingComponent from '../components/AWSLoadingComponent';
import HelpInfoComponent from '../components/HelpInfoComponent';

// TODO: Do we use displayError?
// TODO: Fix ? text

//* -------------- ACTIONS FROM REDUX ----------------------------------- *//

// const mapStateToProps = store => ({
// });

const mapDispatchToProps = dispatch => ({
  hideCreateMenuButton: () => {
    dispatch(actions.hideCreateMenuButton());
  },
});

//* -------------- AWS CONTAINER --------------------------------------- *//
class AwsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      iamRoleName: '',
      vpcStackName: '',
      clusterName: '',
      awsComponentSubmitted: false,
      iamRoleStatus: 'CREATING',
      stackStatus: '—',
      clusterStatus: '—',
      workerNodeStatus: '—',
      kubectlConfigStatus: '—',
      errorMessage: '',
      textInfo: '',
      showInfo: false,
      mouseCoords: {},
      errors: {},
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleStatusChange = this.handleStatusChange.bind(this);
    this.handleConfigAndMakeNodes = this.handleConfigAndMakeNodes.bind(this);
    this.handleNewNodes = this.handleNewNodes.bind(this);
    this.handleError = this.handleError.bind(this);
    this.displayInfoHandler = this.displayInfoHandler.bind(this);
    this.hideInfoHandler = this.hideInfoHandler.bind(this);
  }

  //* -------------- COMPONENT LIFECYCLE METHODS
  /*
   * Once component mounts, activate listeners, to receive data from
   * AWS regarding the cluster creation process
  */
  componentDidMount() {
    const { hideCreateMenuButton } = this.props;
    hideCreateMenuButton();
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

  //* -------------- FORM EVENT HANDLER METHOD
  // Handles text changes in form input fields
  handleChange(e) {
    const { id, value } = e.target;
    e.preventDefault();
    this.setState(prevState => ({ ...prevState, [id]: value }));
  }

  //* --------- CONFIGURE CLUSTER + KUBECTL
  /*
   * When user submits cluster data, method takes data from state, checks for errors,
   * and signals to Main process to begin configuring Kubectl
  */

  handleConfigAndMakeNodes() {
    const { iamRoleName, vpcStackName, clusterName } = this.state;
    const clusterData = {
      iamRoleName,
      vpcStackName,
      clusterName,
    };

    const clusterDataSchema = yup.object().strict().shape({
      iamRoleName: yup.string().required('IAM Role Name is required').max(64),
      vpcStackName: yup.string().required('VPC Stack Name is required').max(128),
      clusterName: yup.string().required('Cluster Name is required').max(100),
    });
    clusterDataSchema.validate(clusterData, { abortEarly: false })
      .then((data) => {
        this.setState(prevState => ({
          ...prevState,
          iamRoleName: '',
          vpcStackName: '',
          clusterName: '',
          errors: {},
          awsComponentSubmitted: true,
        }));

        // TODO: uncomment
        // ipcRenderer.send(events.CREATE_CLUSTER, clusterData);
      })
      .catch((err) => {
        const errorObj = err.inner.reduce((acc, error) => {
          acc[error.path] = error.message;
          return acc;
        }, {});
        this.setState(prevState => ({ ...prevState, errors: errorObj }));
      });
  }

  //* --------- METHODS RUNNING DURING CLUSTER CREATION (10-15 MIN)
  /**
   * Method updates state with data coming back from AWS during cluster creation.
   * Data is displayed on the loading page.
   * @param {String} 'CREATING', 'CREATED', 'ERROR'
  */
  handleStatusChange(event, data) {
    this.setState(prevState => ({ ...prevState, [data.type]: data.status }));
  }

  /**
   * Handles errors coming back from AWS and displays them for the user
   * Data is displayed on the loading page.
   * @param {String} Error message to display
  */
  handleError(event, data) {
    this.setState(prevState => ({
      ...prevState,
      [data.type]: data.status,
      errorMessage: data.errorMessage,
    }));
  }

  //* --------- DISPLAY MORE INFO ( ? ) COMPONENT
  displayInfoHandler(e) {
    const awsInfo = 'Amazon Web Services Elastic Container Service for Kubernetes (EKS) Account Setup. Your Identity and Access Management (IAM) Role for EKS is the AWS identity that will have specific permissions to create and manage your Kubernetes Cluster. For the Role Name, select something that will easily identify the role’s purpose. Example: unique-EKS-Management-Role. Your AWS VPC Stack represents a collection of resources necessary to manage and run your Kubernetes cluster. For the Stack Name, select something that will easily identify the stack’s purpose. Example: unique-EKS-Stack. An EKS Cluster consists of two primary components: The Amazon EKS control plane and Amazon EKS worker nodes that run the Kubernetes etcd and the Kubernetes API server. For the Cluster Name, select something that will easily identify the stack’s purpose. Example: unique-EKS-Cluster. Once submitted, this phase takes 10-15 minutes to complete, depending on Amazon’s processing time. Kre8 cannot proceed until your EKS Account has been set up.';

    const x = e.screenX;
    const y = e.screenY;
    const newCoords = { top: y, left: x };
    this.setState(prevState => ({
      ...prevState,
      textInfo: awsInfo,
      mouseCoords: newCoords,
      showInfo: true,
    }));
  }

  //* --------- HIDE MORE INFO ( ? ) COMPONENT METHOD
  hideInfoHandler() {
    this.setState(prevState => ({ ...prevState, showInfo: false }));
  }

  //* --------- MOVES USER TO GRAPH SCREEN
  /*
   * Activated after last step in cluster creation process completes.
   * If kubectl is successfully configured:
  */
  handleNewNodes(event, data) {
    const { history } = this.props;
    history.push('/cluster');
  }

  //* --------- RENDER
  render() {
    const {
      iamRoleName,
      vpcStackName,
      clusterName,
      awsComponentSubmitted,
      iamRoleStatus,
      stackStatus,
      clusterStatus,
      workerNodeStatus,
      kubectlConfigStatus,
      textInfo,
      showInfo,
      mouseCoords,
      errorMessage,
      errors,
    } = this.state;

    //* --------- RETURN
    return (
      <div className="aws_cluster_page_container">
        {showInfo === true && (
        <HelpInfoComponent
          textInfo={textInfo}
          hideInfoHandler={this.hideInfoHandler}
          mouseCoords={mouseCoords}
        />
        )}

        {awsComponentSubmitted === false && (
          <AWSComponent
            handleChange={this.handleChange}
            handleConfigAndMakeNodes={this.handleConfigAndMakeNodes}
            hideInfoHandler={this.hideInfoHandler}
            displayInfoHandler={this.displayInfoHandler}
            iamRoleName={iamRoleName}
            vpcStackName={vpcStackName}
            clusterName={clusterName}
            errors={errors}
            textInfo={textInfo}
            mouseCoords={mouseCoords}
            grabCoords={this.grabCoords}
          />
        )}

        {awsComponentSubmitted === true && (
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

export default withRouter(connect(null, mapDispatchToProps)(AwsContainer));
