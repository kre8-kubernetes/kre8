import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';
import * as yup from 'yup';

import CreateMenuItemComponent from '../components/GraphComponents/CreateMenuItemComponent';

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
      errors: {pod: {}, deployment: {}, service: {}},
      display_error: false,
    }
    this.handleChange = this.handleChange.bind(this);

    this.handleCreatePod = this.handleCreatePod.bind(this);
    this.handleNewPod = this.handleNewPod.bind(this);

    this.handleCreateDeployment = this.handleCreateDeployment.bind(this);
    this.handleNewDeployment = this.handleNewDeployment.bind(this);

    this.handleCreateService = this.handleCreateService.bind(this);
    this.handleNewService = this.handleNewService.bind(this);
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

  //CREATE POD HANDLER
  handleCreatePod() {
    const schema = yup.object().strict().shape({
      podName: yup.string().required().lowercase(),
      containerName: yup.string().required(),
      imageName: yup.string().required(),
    })
    schema.validate(this.state.inputData.pod, {abortEarly: false})
      .then((data) => {
        console.log('from the then', data)
        this.setState({ ...this.state, errors: { ...this.state.errors, pod: {} } })
        ipcRenderer.send(events.CREATE_POD, this.state.inputData.pod);
      })
      .catch((err) => {
        console.log('err', err);
        const errorObj = err.inner.reduce((acc, error, i) => {
          acc[error.path] = error.message;
          return acc;
        }, {});
        this.setState({ ...this.state, errors: { ...this.state.errors, pod: errorObj } })
      })
  }

  //CREATE DEPLOYMENT HANDLER
  handleCreateDeployment() {
    const clone = Object.assign({}, this.state.inputData.deployment);
    clone.containerPort = Number(clone.containerPort);
    clone.replicas = Number(clone.replicas);
    const schema = yup.object().strict().shape({
      deploymentName: yup.string().required().lowercase(),
      appName: yup.string().required().lowercase(),
      containerName: yup.string().required().lowercase(),
      image: yup.string().required().lowercase(),
      containerPort: yup.number().required().positive(),
      replicas: yup.number().required().positive().max(4),
    })
    schema.validate(clone, { abortEarly: false })
      .then((data) => {
        console.log('from the then', data)
        this.setState({ ...this.state, errors: { ...this.state.errors, deployment: {} } })
          ipcRenderer.send(events.CREATE_DEPLOYMENT, this.state.inputData.deployment);
      })
      .catch((err) => {
        console.log('err', err);
        const errorObj = err.inner.reduce((acc, error, i) => {
          acc[error.path] = error.message;
          return acc;
        }, {});
        this.setState({ ...this.state, errors: { ...this.state.errors, deployment: errorObj } })
      })
  }

  //CREATE SERVICE HANDLER
  handleCreateService() {
    const clone = Object.assign({}, this.state.inputData.service);
    clone.containerPort = Number(clone.port);
    clone.replicas = Number(clone.targetPort);
    const schema = yup.object().strict().shape({
      serviceName: yup.string().required().lowercase(),
      appName: yup.string().required().lowercase(),
      port: yup.number().required().positive(),
      targetPort: yup.number().required().positive(),
    })
    schema.validate(clone, { abortEarly: false })
      .then((data) => {
        console.log('from the then', data)
        this.setState({ ...this.state, errors: { ...this.state.errors, service: {} } })
        ipcRenderer.send(events.CREATE_SERVICE, this.state.inputData.service);
      })
      .catch((err) => {
        console.log('err', err);
        const errorObj = err.inner.reduce((acc, error, i) => {
          acc[error.path] = error.message;
          return acc;
        }, {});
        this.setState({ ...this.state, errors: { ...this.state.errors, service: errorObj } })
      })
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
    console.log('errsss', this.state.errors);
    const { menuItemToShow } = this.props;
    const inputDataToShow = this.state.inputData[menuItemToShow];
    const handleFunction = menuItemToShow === 'pod' ? this.handleCreatePod :
                           menuItemToShow === 'service' ? this.handleCreateService :
                           menuItemToShow === 'deployment' ? this.handleCreateDeployment : null;
    
    const textObj = {pod: 'Pod text here', service: 'Service text here', deployment: <a href="https://kubernetes.io/docs/concepts/workloads/controllers/deployment/">deployment text here</a>};
    const text = textObj[menuItemToShow];

    return (
      <div>
        {this.props.showCreateMenuItem === true && (
          <CreateMenuItemComponent
            handleChange={this.handleChange}
            menuItemToShow={this.props.menuItemToShow}
            toggleCreateMenuItem={this.props.toggleCreateMenuItem}
            handleFunction={handleFunction}
            infoText={text}

            errors={this.state.errors}

            inputDataToShow={inputDataToShow}
          />
        )}
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(CreateMenuItemContainer))