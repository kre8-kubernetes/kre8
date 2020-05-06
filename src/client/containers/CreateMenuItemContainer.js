import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import { setLocale } from 'yup';
import * as actions from '../store/actions/actions';
import * as events from '../../eventTypes';

import {
  podFormValidate,
  deploymentFormValidate,
  serviceFormValidate,
  makeError,
} from '../utils/validation';

import OutsideClick from '../utils/OutsideClick';
import CreateMenuItemComponent from '../components/GraphComponents/CreateMenuItemComponent';

/** ------------ CREATE MENU ITEM CONTAINER  ------------------
  ** Rendered by KubectlContainer
  ** Renders the CreateMenuItemComponent
  * Activated when a user clicks the hambureger icon at top left of nav bar
  * Offers options of "Create a Pod", "Create a Service", "Create a Deployment"
  * Generates the appropriate creation form (CreateMenuItemComponent) based on user selection
*/

//* --------------- STATE + ACTIONS FROM REDUX ----------------- *//
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

//* --------------- CREATE MENU ITEM COMPONENT --------------------------- *//
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


  //* -------------- COMPONENT LIFECYCLE METHODS -----------------
  componentDidMount() {
    ipcRenderer.on(events.HANDLE_NEW_POD, this.handleNewPod);
    ipcRenderer.on(events.HANDLE_NEW_SERVICE, this.handleNewService);
    ipcRenderer.on(events.HANDLE_NEW_DEPLOYMENT, this.handleNewDeployment);
  }

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

  // SIGNALS TO CLOSE THE DROPDOWN MENU, AND COMPONENT CREATION FORM WHEN PUSHES 'X' BUTTON
  handleFormClose() {
    const { toggleCreateMenuFormItem, toggleCreateMenuDropdown } = this.props;
    toggleCreateMenuFormItem();
    toggleCreateMenuDropdown(false);
  }

  // SIGNALS TO CLOSE THE COMPONENT CREATION FORM WHEN USER CLICKS OUTSIDE OF FORM
  handleOutsideFormClick() {
    const { toggleCreateMenuFormItem } = this.props;
    toggleCreateMenuFormItem();
  }

  // GENERATES LOADING SCREEN AFTER USER SUBMITS DATA AND KUBERNETES COMPONENTS ARE BEING CREATED
  handleCreateLoadingScreen() {
    this.setState(prevState => ({ ...prevState, createLoadingScreen: true }));
  }

  /** ------------ CREATE COMPONENT METHODS ------------------
   * Called when user inputs cluster component data and submits to create the component
   * Error handlers check data, if input passes, data is passed to main thread
   * where data is sent to kubectl to create items
  */
  // CREATE POD METHOD
  handleCreatePod() {
    const { inputData } = this.state;
    const { pod } = inputData;

    setLocale({
      string: {
        lowercase: 'Entry must be lowercase',
        max: '${max} character maximum',
      },
    });

    podFormValidate(pod)
      .then((data) => {
        this.handleCreateLoadingScreen();
        this.setState(prevState => ({
          ...prevState,
          errors: { ...prevState.errors, pod: {} },
        }));
        ipcRenderer.send(events.CREATE_POD, data);
      })
      .catch((err) => {
        this.setState(prevState => ({
          ...prevState,
          errors: { ...prevState.errors, pod: makeError(err) },
        }));
      });
  }

  // CREATE DEPLOYMENT METHOD
  handleCreateDeployment() {
    const { inputData } = this.state;
    const { deployment } = inputData;
    const deploymentClonne = Object.assign({}, deployment);
    deploymentClonne.containerPort = Number(deploymentClonne.containerPort);
    deploymentClonne.replicas = Number(deploymentClonne.replicas);

    setLocale({
      string: {
        lowercase: 'Entry must be lowercase',
        max: '${max} character maximum'        
      },
      number: {
        num: 'Entry must be a number',
        positive: 'Entry must be a positive number',
      },
    });

    deploymentFormValidate(deploymentClonne)
      .then((data) => {
        this.handleCreateLoadingScreen();
        this.setState(prevState => ({
          ...prevState,
          errors: { ...prevState.errors, deployment: {} },
        }));
        ipcRenderer.send(events.CREATE_DEPLOYMENT, data);
      })
      .catch((err) => {
        this.setState(prevState => ({
          ...prevState,
          errors: { ...prevState.errors, deployment: makeError(err) },
        }));
      });
  }

  // CREATE SERVICE METHOD
  handleCreateService() {
    const { inputData } = this.state;
    const { service } = inputData;
    const serviceClone = Object.assign({}, service);
    serviceClone.port = Number(serviceClone.port);
    serviceClone.targetPort = Number(serviceClone.targetPort);

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

    serviceFormValidate(serviceClone)
      .then((data) => {
        this.handleCreateLoadingScreen();
        this.setState(prevState => ({
          ...prevState,
          errors: { ...prevState.errors, service: {} },
        }));
        ipcRenderer.send(events.CREATE_SERVICE, data);
      })
      .catch((err) => {
        this.setState(prevState => ({
          ...prevState,
          errors: { ...prevState.errors, service: makeError(err) },
        }));
      });
  }

  /** --------------- COMPONENT CREATION STATUS -------------
   * Called by event listeners as data returns from Main thread from kubectl
   * @param {object} data if includes an error, display error for user, otherwise
   * reset state
  */

  //* POD STATUS
  handleNewPod(event, data) {
    const { inputData } = this.state;
    const { pod } = inputData;
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

  //* SERVICE STATUS
  handleNewService(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    const { inputData } = this.state;
    const { service } = inputData;

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

  //* DEPLOYMENT STATUS
  handleNewDeployment(event, data) {
    const { inputData } = this.state;
    const { deployment } = inputData;
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

  //* --------- RENDER METHOD
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
    
    //* --------- RETURN
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
