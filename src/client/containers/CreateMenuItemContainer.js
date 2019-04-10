import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import * as yup from 'yup';
import { setLocale, object, string, mixed } from 'yup';
import * as actions from '../store/actions/actions';
import * as events from '../../eventTypes';

import OutsideClick from '../helperFunctions/OutsideClick';
import CreateMenuItemComponent from '../components/GraphComponents/CreateMenuItemComponent';

const mapStateToProps = store => ({
  showCreateMenuFormItem: store.navbar.showCreateMenuFormItem,
  menuItemToShow: store.navbar.menuItemToShow,
});

const mapDispatchToProps = dispatch => ({
  toggleCreateMenuFormItem: (bool) => {
    dispatch(actions.toggleCreateMenuFormItem(bool));
  },
  toggleCreateMenuDropdown: (bool) => {
    dispatch(actions.toggleCreateMenuDropdown(bool));
  },
});

class CreateMenuItemContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      inputData: {
        pod: {
          podName: '',
          containerName: '',
          imageName: '',
        },
        deployment: {
          deploymentName: '',
          applicationName: '',
          containerName: '',
          image: '',
          containerPort: '',
          replicas: '',
        },
        service: {
          serviceName: '',
          applicationName: '',
          port: '',
          targetPort: '',
        },
      },
      errors: { pod: {}, deployment: {}, service: {} },
      display_error: false,
      helpInfoComponent: false,
      createLoadingScreen: false,
      creationError: false,
      creationErrorText: '',
    };
    this.handleChange = this.handleChange.bind(this);

    this.handleCreatePod = this.handleCreatePod.bind(this);
    this.handleNewPod = this.handleNewPod.bind(this);

    this.handleCreateDeployment = this.handleCreateDeployment.bind(this);
    this.handleNewDeployment = this.handleNewDeployment.bind(this);

    this.handleCreateService = this.handleCreateService.bind(this);
    this.handleNewService = this.handleNewService.bind(this);

    this.handleFormClose = this.handleFormClose.bind(this);
    this.handleOutsideFormClick = this.handleOutsideFormClick.bind(this);
    this.handleCreateLoadingScreen = this.handleCreateLoadingScreen.bind(this);
  }


  // -------------- COMPONENT LIFECYCLE METHODS -----------------

  // DEPLOYMENT LIFECYCLE METHOD
  componentDidMount() {
    ipcRenderer.on(events.HANDLE_NEW_POD, this.handleNewPod);
    ipcRenderer.on(events.HANDLE_NEW_SERVICE, this.handleNewService);
    ipcRenderer.on(events.HANDLE_NEW_DEPLOYMENT, this.handleNewDeployment);
  }

  // On component unmount, we will unsubscribe to listeners
  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_NEW_POD, this.handleNewPod);
    ipcRenderer.removeListener(events.HANDLE_NEW_SERVICE, this.handleNewService);
    ipcRenderer.removeListener(events.HANDLE_NEW_DEPLOYMENT, this.handleNewDeployment);
  }

  //* ------------------- EVENT HANDLERS ------------------------

  // HANDLE INPUT CHANGE METHOD FOR FORMS
  handleChange(e) {
    const { value } = e.target;
    e.preventDefault();
    const split = e.target.id.split('_');
    this.setState((prevState) => {
      const newState = {
        ...prevState,
        inputData: {
          ...prevState.inputData,
          pod: { ...prevState.inputData.pod },
          deployment: { ...prevState.inputData.deployment },
          service: { ...prevState.inputData.service },
        },
      };
      newState.inputData[split[0]][split[1]] = value;
      return newState;
    });
  }

  // GENERATES LOADING SCREEN WHEN KUBERNETES COMPONENTS ARE BEING CREATED
  handleCreateLoadingScreen() {
    this.setState(prevState => ({ ...prevState, createLoadingScreen: true }));
  }

  //* --------- CREATE COMPONENT METHODS
  /**
   * Called when user inputs cluster component data and submits
   * Error handlers check data, if input passes, data is passed to main thread
   * where data is sent to kubectl to create items
  */

  // CREATE POD HANDLER
  handleCreatePod() {
    const { inputData } = this.state;
    const { pod } = inputData;
    setLocale({
      string: {
        lowercase: 'Entry must be lowercase',
        max: '${max} character maximum',
      },
    });
    const schema = yup.object().strict().shape({
      podName: yup.string().required('Pod name is required').lowercase().max(253),
      containerName: yup.string().required('Container name is required').lowercase().max(253),
      imageName: yup.string().required('Image name is required').lowercase().max(253),
    });
    schema.validate(pod, { abortEarly: false })
      .then((data) => {
        this.handleCreateLoadingScreen();
        this.setState(prevState => ({ ...prevState, errors: { ...prevState.errors, pod: {} } }));
        ipcRenderer.send(events.CREATE_POD, data);
      })
      .catch((err) => {
        const errorObj = err.inner.reduce((acc, error) => {
          acc[error.path] = error.message;
          return acc;
        }, {});
        this.setState(prevState => ({ ...prevState, errors: { ...prevState.errors, pod: errorObj } }));
      });
  }

  // CREATE DEPLOYMENT HANDLER
  handleCreateDeployment() {
    const { inputData } = this.state;
    const { deployment } = inputData;
    const clone = Object.assign({}, deployment);
    clone.containerPort = Number(clone.containerPort);
    clone.replicas = Number(clone.replicas);
    setLocale({
      string: {
        lowercase: 'Entry must be lowercase',
        max: '${max} character maximum',
        
      },
      number: {
        num: 'Entry must be a number',
        positive: 'Entry must be a positive number',
      },
    });
    const schema = yup.object().strict().shape({
      deploymentName: yup.string().required('Deployment name is required').lowercase(),
      applicationName: yup.string().required('Application name is required').lowercase(),
      containerName: yup.string().required('Container name is required').lowercase(),
      image: yup.string().required('Image name is required').lowercase(),
      containerPort: yup.number().required('Container port is required').positive(),
      replicas: yup.number().required('Number of replicas is required').positive().max(4),
    });
    schema.validate(clone, { abortEarly: false })
      .then((data) => {
        this.handleCreateLoadingScreen();
        this.setState(prevState => ({ ...prevState, errors: { ...prevState.errors, deployment: {} } }));
        ipcRenderer.send(events.CREATE_DEPLOYMENT, data);
      })
      .catch((err) => {
        const errorObj = err.inner.reduce((acc, error) => {
          acc[error.path] = error.message;
          return acc;
        }, {});
        this.setState(prevState => ({ ...prevState, errors: { ...prevState.errors, deployment: errorObj } }));
      });
  }

  // CREATE SERVICE HANDLER
  handleCreateService() {
    const { inputData } = this.state;
    const { service } = inputData;
    const clone = Object.assign({}, service);
    clone.port = Number(clone.port);
    clone.targetPort = Number(clone.targetPort);
    setLocale({
      string: {
        lowercase: 'Entry must be lowercase',
        num: 'Entry must be a number',
        max: '${max} character maximum',
      },
      number: {
        num: 'Entry must be a number',
        positive: 'Entry must be a positive number',
      },
    });
    const schema = yup.object().strict().shape({
      serviceName: yup.string().required('Service name is required').lowercase(),
      applicationName: yup.string().required('Application name is required').lowercase(),
      port: yup.number().required('Port number is required').positive(),
      targetPort: yup.number().required('Target port number is required').positive(),
    });
    schema.validate(clone, { abortEarly: false })
      .then((data) => {
        this.handleCreateLoadingScreen();
        this.setState(prevState => ({ ...prevState, errors: { ...prevState.errors, service: {} } }));
        ipcRenderer.send(events.CREATE_SERVICE, data);
      })
      .catch((err) => {
        const errorObj = err.inner.reduce((acc, error) => {
          acc[error.path] = error.message;
          return acc;
        }, {});
        this.setState(prevState => ({ ...prevState, errors: { ...prevState.errors, service: errorObj } }));
      });
  }


  





  //* --------------INCOMING DATA FROM MAIN THREAD-----------------

  // INCOMING POD DATA
  handleNewPod(event, data) {
    const { inputData } = this.state;
    const { pod } = inputData;
    console.log('incoming data from kubectl pod creation:', data);
    const emptyPodObj = Object.entries(pod).reduce((acc, item) => {
      acc[item[0]] = '';
      return acc;
    }, {});
    if (data.includes('error')) {
      this.setState(prevState => ({
        ...prevState,
        creationError: true,
        creationErrorText: data,
        inputData: {
          ...prevState.inputData,
          pod: emptyPodObj,
        },
      }));
    } else {
      this.setState(prevState => ({
        ...prevState,
        inputData: {
          ...prevState.inputData,
          pod: emptyPodObj,
        },
      }));
    }
  }

/** --------- DEPLOYMENT STATUS DATA PROCESSED FROM MAIN THREAD ------------------
 * @param {Object} event
 * @param {Object} data - object containing the data from kubectl regarding the status of the deployment user created
 * @result set state
*/
  handleNewDeployment(event, data) {
    const { inputData } = this.state;
    const { deployment } = inputData;
    console.log('incoming data from kubectl deployment creation:', data);
    const emptyDeploymentObj = Object.entries(deployment).reduce((acc, item) => {
      acc[item[0]] = '';
      return acc;
    }, {});
    if (data.includes('error')) {
      this.setState(prevState => ({
        ...prevState,
        creationError: true,
        creationErrorText: data,
      }));
    } else {
      this.setState(prevState => ({
        ...prevState,
        inputData: {
          ...prevState.inputData,
          deployment: emptyDeploymentObj,
        },
      }));
    }
  }

  // INCOMING SERVICE DATA
  handleNewService(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    const { inputData } = this.state;
    const { service } = inputData;
    console.log('incoming data from kubectl service creation:', data);

    const emptyServiceObj = Object.entries(service).reduce((acc, item) => {
      acc[item[0]] = '';
      return acc;
    }, {});
    if (data.includes('error')) {
      this.setState(prevState => ({
        ...prevState,
        creationError: true,
        creationErrorText: data,
        inputData: {
          ...prevState.inputData,
          service: emptyServiceObj,
        },
      }));
    } else {
      this.setState(prevState => ({
        ...prevState,
        inputData: {
          ...prevState.inputData,
          service: emptyServiceObj,
        },
      }));
    }
  }

  handleFormClose() {
    const { toggleCreateMenuFormItem, toggleCreateMenuDropdown } = this.props;
    toggleCreateMenuFormItem();
    toggleCreateMenuDropdown(false);
  }

  handleOutsideFormClick() {
    const { toggleCreateMenuFormItem } = this.props;
    toggleCreateMenuFormItem();
  }

  render() {
    const { menuItemToShow, showCreateMenuFormItem } = this.props;
    const {
      inputData,
      errors,
      createLoadingScreen,
      creationErrorText,
      creationError,
    } = this.state;
    const inputDataToShow = inputData[menuItemToShow];
    const handleFunction = menuItemToShow === 'pod' ? this.handleCreatePod :
                           menuItemToShow === 'service' ? this.handleCreateService :
                           menuItemToShow === 'deployment' ? this.handleCreateDeployment : null;
    console.log('menuItemToShow: ', menuItemToShow);

    return (
      <div>
        {showCreateMenuFormItem === true && (
          <OutsideClick handleOutsideClick={this.handleOutsideFormClick}>
            <CreateMenuItemComponent
              handleChange={this.handleChange}
              menuItemToShow={menuItemToShow}
              handleFormClose={this.handleFormClose}
              handleFunction={handleFunction}
              errors={errors}
              inputDataToShow={inputDataToShow}
              createLoadingScreen={createLoadingScreen}
              creationErrorText={creationErrorText}
              creationError={creationError}
            />
          </OutsideClick>
        )}
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(CreateMenuItemContainer));
