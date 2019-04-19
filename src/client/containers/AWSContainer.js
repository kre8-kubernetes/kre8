import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { withRouter } from 'react-router-dom';

import * as yup from 'yup';

import * as actions from '../store/actions/actions';
import * as events from '../../eventTypes';

import AWSComponent from '../components/AWSComponent';
import AWSLoadingComponent from '../components/AWSLoadingComponent';
import HelpInfoComponent from '../components/HelpInfoComponents/HelpInfoComponent';

/** ------------ HOME CONTAINER — SECOND PAGE USER ENCOUNTERS ON INITIAL APP USE----------------------
  ** Renders the AWS Component and AWS Loading Component
  * On user's initial encounter with the application, renders the
  * AWSComponent, which features a form requesting the user input names for their
  * IAM Role, VPC Stack and Cluster. After submitting, renders
  * AWS Loading Component which displays the status of each of the items being created
  * User can navigate back to page via the Nav bar to create a new cluster
*/

//* --------------- STATE + ACTIONS FROM REDUX ----------------- *//

const mapStateToProps = store => ({
  creatingCluster: store.aws.creatingCluster,
  iamRoleName: store.aws.formStrings.iamRoleName,
  vpcStackName: store.aws.formStrings.vpcStackName,
  clusterName: store.aws.formStrings.clusterName,
});

const mapDispatchToProps = dispatch => ({
  hideCreateMenuButton: () => {
    dispatch(actions.hideCreateMenuButton());
  },
  setCredentialStatusTrue: () => {
    dispatch(actions.setCredentialStatusTrue());
  },
  toggleCreatingCluster: (bool) => {
    dispatch(actions.toggleCreatingCluster(bool));
  },
  handleFormString: (objProp) => {
    dispatch(actions.handleFormString(objProp));
  },
  clearFormStrings: () => {
    dispatch(actions.clearFormStrings());
  },
});

//* -------------- AWS CONTAINER --------------------------------------- *//
class AwsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      iamRoleStatus: 'CREATING',
      stackStatus: '—',
      clusterStatus: '—',
      workerNodeStatus: '—',
      kubectlConfigStatus: '—',
      errorMessage: '',
      aws: true,
      textInfo: '',
      showInfo: false,
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

  /** ------------ COMPONENT LIFECYCLE METHODS ----------------------
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
    const { handleFormString } = this.props;
    const { id, value } = e.target;
    e.preventDefault();
    handleFormString({ name: id, value });
  }

  /** ------------ CONFIGURE CLUSTER + KUBECTL ----------------------
  * When user submits IAM Role Name, VPC Stack Name and Cluter Name,
  * method takes data from state, checks for errors using YUP,
  * and signals to Main process to begin configuring creating the cluster and configuring kubectl.
  * User is redirected to AWSLoadingComponent
 */
  handleConfigAndMakeNodes() {
    const { toggleCreatingCluster, iamRoleName, vpcStackName, clusterName } = this.props;
    const clusterData = { iamRoleName, vpcStackName, clusterName };

    const clusterDataSchema = yup.object().strict().shape({
      iamRoleName: yup.string().required('IAM Role Name is required').max(64),
      vpcStackName: yup.string().required('VPC Stack Name is required').max(128),
      clusterName: yup.string().required('Cluster Name is required').max(100),
    });
    clusterDataSchema.validate(clusterData, { abortEarly: false })
      .then((data) => {
        ipcRenderer.send(events.CREATE_CLUSTER, data);
        toggleCreatingCluster(true);
      })
      .catch((err) => {
        const errorObj = err.inner.reduce((acc, error) => {
          acc[error.path] = error.message;
          return acc;
        }, {});
        this.setState(prevState => ({ ...prevState, errors: errorObj }));
      });
  }

  //* ------------ METHODS RUNNING DURING CLUSTER CREATION (10-15 MIN) ----------------------
  /** ------------ DISPLAYS STATUS UPDATES FOR USER ON LOADING PAGE ----------------------
   * Method updates state with data coming back from AWS during cluster creation.
   * Data is displayed via the AWSLoadingComponent.
   * @param {String} 'CREATING', 'CREATED', 'ERROR'
  */
  handleStatusChange(event, data) {
    this.setState(prevState => ({ ...prevState, [data.type]: data.status }));
  }

  /** ------------ DISPLAYS ERRORS FOR USER ON LOADING PAGE ----------------------
   * Handles errors coming back from AWS and displays them for the user
   * Data is displayed on the loading page.
   * @param {String} Error message to display
  */
  handleError(event, data) {
    console.log('DATA FROM HANDLE ERROR: ', data);
    this.setState(prevState => ({
      ...prevState,
      [data.type]: data.status,
      errorMessage: data.errorMessage,
    }));
  }

  //* ------------ METHOD MOVES USER TO GRAPH SCREEN AT END OF PROCESS ----------------------
  /**
  * Activated after last step in cluster creation process completes.
  * If kubectl is successfully configured, moves user to the graph page (KubectlContainer)
  */
  handleNewNodes(event, data) {
    const { history, setCredentialStatusTrue, toggleCreatingCluster, clearFormStrings } = this.props;
    this.setState(prevState => ({
      ...prevState,
      errors: {},
    }));
    clearFormStrings();
    setCredentialStatusTrue();
    toggleCreatingCluster(false);
    history.push('/cluster');
  }

  //* ------------ DISPLAY OR HIDE MORE INFO ( ? ) COMPONENT ----------------------
  // DISPLAY
  displayInfoHandler() {
    this.setState(prevState => ({ ...prevState, showInfo: true }));
  }

  // HIDE
  hideInfoHandler() {
    this.setState(prevState => ({ ...prevState, showInfo: false }));
  }

  //* --------- RENDER
  render() {
    const {
      iamRoleStatus,
      stackStatus,
      clusterStatus,
      workerNodeStatus,
      kubectlConfigStatus,
      aws,
      textInfo,
      showInfo,
      mouseCoords,
      errorMessage,
      errors,
    } = this.state;

    const {
      creatingCluster,
      iamRoleName,
      vpcStackName,
      clusterName,
    } = this.props;

    //* --------- RETURN
    return (
      <div className="aws_cluster_page_container">
        {showInfo === true && (
          <HelpInfoComponent
            textInfo={textInfo}
            hideInfoHandler={this.hideInfoHandler}
            mouseCoords={mouseCoords}
            aws={aws}
          />
        )}
        {/* **If the the user has not yet completed and submitted AWS Component Data, display form** */}
        {creatingCluster === false && (
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
        {/* **Once the user has submitted the AWS Component Data, display the AWSLoading page** */}
        {creatingCluster === true && (
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
