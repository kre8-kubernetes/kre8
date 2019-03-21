import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import CreateMenuItemComponent from '../components/CreateMenuItemComponent';
import SimpleReactValidator from 'simple-react-validator';

const mapStateToProps = store => ({
  showCreateMenuItem: store.navbar.showCreateMenuItem,
  menuItemToShow: store.navbar.menuItemToShow,
});

const mapDispatchToProps = dispatch => ({
  toggleCreateMenuItem: () => {
    dispatch(actions.toggleCreateMenuItem())
  }
});

class CreateMenuItemContainer extends Component {
  constructor(props) {
    super(props);

    this.validator = new SimpleReactValidator({
      element: (message, className) => <div className="errorClass">{message}</div>
    });

    this.validator1 = new SimpleReactValidator({
      element: (message, className) => <div className="errorClass">{message}</div>
    });

    this.validator2 = new SimpleReactValidator({
      element: (message, className) => <div className="errorClass">{message}</div>
    });

    this.state = {
      inputData: {
        pod: {
          podName: '',
          containerName: '',
          imageName: '',
        },
        deployment: {
          deploymentName: '',
          appName: '', 
          containerName: '',
          image: '',
          containerPort: '',
          replicas: '',
        },
        service: {
          serviceName: '',
          appName: '',
          port: '',
          targetPort: '',
        }
      },
      display_error: false,
    }

    this.handleChange = this.handleChange.bind(this);

    this.handleCreatePod = this.handleCreatePod.bind(this);
    this.handleNewPod = this.handleNewPod.bind(this);

    this.handleCreateDeployment = this.handleCreateDeployment.bind(this);
    this.handleNewDeployment = this.handleNewDeployment.bind(this);

    this.handleCreateService = this.handleCreateService.bind(this);
    this.handleNewService = this.handleNewService.bind(this);

    this.testFormValidation = this.testFormValidation.bind(this);
  }

  //**--------------COMPONENT LIFECYCLE METHODS-----------------**//

  // DEPLOYMENT LIFECYCLE METHOD
  componentDidMount() {
    ipcRenderer.on(events.HANDLE_NEW_POD, this.handleNewPod)
    ipcRenderer.on(events.HANDLE_NEW_SERVICE, this.handleNewService)
    ipcRenderer.on(events.HANDLE_NEW_DEPLOYMENT, this.handleNewDeployment)
  }

  // On component unmount, we will unsubscribe to listeners
  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_NEW_POD, this.handleNewPod);
    ipcRenderer.removeListener(events.HANDLE_NEW_SERVICE, this.handleNewService);
    ipcRenderer.removeListener(events.HANDLE_NEW_DEPLOYMENT, this.handleNewDeployment);
  }

  //**--------------EVENT HANDLERS-----------------**//

  //HANDLE CHANGE METHOD FOR FORMS
  handleChange(e) {
    e.preventDefault();
    const split = e.target.id.split('_');
    const newState = { ...this.state, 
      inputData: { ...this.state.inputData,
        pod: {...this.state.inputData.pod},
        deployment: {...this.state.inputData.deployment},
        service: {...this.state.inputData.service},
      }
    }
    newState.inputData[split[0]][split[1]] = e.target.value;
    this.setState(newState);
  };

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

  testFormValidation1() {
    if (this.validator1.allValid()) {
      alert('Your deployment is being created!');
      return true;
    } else {
      this.validator1.showMessages();
      this.forceUpdate();
      return false;
    }
  }

  testFormValidation2() {
    if (this.validator2.allValid()) {
      alert('Your service is being created!');
      return true;
    } else {
      this.validator2.showMessages();
      this.forceUpdate();
      return false;
    }
  }

  //CREATE POD HANDLER
  handleCreatePod(data) {
    console.log('handleCreatePod Clicked!!!');
    if (this.testFormValidation()) {
      console.log("All form data passed validation");
      ipcRenderer.send(events.CREATE_POD, this.state.inputData.pod);
    } else {
      console.log("Invalid or missing data entry");
    }
  }

  //CREATE DEPLOYMENT HANDLER
  handleCreateDeployment(data) {
    console.log('handleCreateDeployment Clicked!!!');
    if (this.testFormValidation1()) {
      console.log("All form data passed validation");
      ipcRenderer.send(events.CREATE_DEPLOYMENT, this.state.inputData.deployment);
    } else {
      console.log("Invalid or missing data entry");
    }
  }

  //CREATE SERVICE HANDLER
  handleCreateService(data) {
    console.log('handleCreateService Clicked!!!');
    if (this.testFormValidation2()) {
      console.log("All form data passed validation");
      ipcRenderer.send(events.CREATE_SERVICE, this.state.inputData.service);
    }
    console.log("Invalid or missing data entry");
  }

  //**--------------INCOMING DATA FROM MAIN THREAD-----------------**//

  //INCOMING POD DATA
  handleNewPod(event, data) {
    console.log('incoming data from kubectl pod creation:', data);
    const emptyPodObj = Object.entries(this.state.inputData.pod).reduce((acc, item) => {
      acc[item[0]] = '';
      return acc;
    }, {});
    this.setState({...this.state, inputData: {...this.state.inputData, pod: emptyPodObj}});
  }

  //INCOMING DEPLOYMENT DATA 
  handleNewDeployment(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming data from kubectl deployment creation:', data);
    const emptyDeploymentObj = Object.entries(this.state.inputData.deployment).reduce((acc, item) => {
      acc[item[0]] = '';
      return acc;
    }, {});
    this.setState({ ...this.state, inputData: { ...this.state.inputData, deployment: emptyDeploymentObj } });
  }


  //INCOMING SERVICE DATA
  handleNewService(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming data from kubectl service creation:', data);
    const emptyServiceObj = Object.entries(this.state.inputData.service).reduce((acc, item) => {
      acc[item[0]] = '';
      return acc;
    }, {});
    this.setState({ ...this.state, inputData: { ...this.state.inputData, service: emptyServiceObj } });
  }

  render() {
    const { menuItemToShow } = this.props;
    const inputDataToShow = this.state.inputData[menuItemToShow];
    const handleFunction = menuItemToShow === 'pod' ? this.handleCreatePod :
                           menuItemToShow === 'service' ? this.handleCreateService :
                           menuItemToShow === 'deployment' ? this.handleCreateDeployment : null;

    return (
      <div>
        {this.props.showCreateMenuItem === true && (
          <CreateMenuItemComponent
            handleChange={this.handleChange}
            menuItemToShow={this.props.menuItemToShow}
            toggleCreateMenuItem={this.props.toggleCreateMenuItem}
            handleFunction={handleFunction}

            validator1={this.validator1}

            inputDataToShow={inputDataToShow}
          />
        )}
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(CreateMenuItemContainer))