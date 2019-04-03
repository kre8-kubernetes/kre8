import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';
import * as yup from 'yup';

import OutsideClick from '../helperFunctions/OutsideClick.js';
import CreateMenuItemComponent from '../components/GraphComponents/CreateMenuItemComponent';
import HelpInfoButton from '../components/Buttons/HelpInfoButton';


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

    this.showKubeDocs = this.showKubeDocs.bind(this);
    this.handleFormClose = this.handleFormClose.bind(this);
    this.handleOutsideFormClick = this.handleOutsideFormClick.bind(this);
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
        this.props.toggleCreateMenuFormItem();
        console.log('from the then', data)
        this.setState({ ...this.state, errors: { ...this.state.errors, deployment: {} } })
          ipcRenderer.send(events.CREATE_DEPLOYMENT, this.state.inputData.deployment);
          ipcRenderer.send(events.START_LOADING_ICON, 'open')
          console.log('sent start loading icon on front from createmenuitemcontainer')
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
  
  //SHOW KUBE DOCS
  showKubeDocs(modal){
    if (modal === 'deployment'){
      ipcRenderer.send(events.SHOW_KUBE_DOCS_DEPLOYMENT);
    } else if (modal === 'service'){
      ipcRenderer.send(events.SHOW_KUBE_DOCS_SERVICE);
    }else if (modal === 'pod'){
      ipcRenderer.send(events.SHOW_KUBE_DOCS_POD);
    }
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
    console.log('errsss', this.state.errors);
    const { menuItemToShow } = this.props;
    const inputDataToShow = this.state.inputData[menuItemToShow];
    const handleFunction = menuItemToShow === 'pod' ? this.handleCreatePod :
                           menuItemToShow === 'service' ? this.handleCreateService :
                           menuItemToShow === 'deployment' ? this.handleCreateDeployment : null;
    
                           
    const textObj = {
      pod: 'A Pod is the smallest deployable unit in the Kubernetes object model.', 
      service: 'A Service is an abstraction which defines a set of Pods and a policy by which to access them.', 
      deployment: 'A Deployment is a controller that maintains the number of Pod replicas the user declares.'};
    const text = textObj[menuItemToShow];
                           
    const moreInfoButtons = {
      pod: <button onClick={() => this.showKubeDocs('pod')} className="help_button" type="button">?</button>, 
      service: <button onClick={() => this.showKubeDocs('service')} className="help_button" type="button">?</button>, 
      deployment: <button onClick={() => this.showKubeDocs('deployment')} className="help_button" type="button">?</button>};
    const button = moreInfoButtons[menuItemToShow];
                           
    return (
      <div>
        {this.props.showCreateMenuFormItem === true && (
          <OutsideClick handleOutsideClick={this.handleOutsideFormClick}>
            <CreateMenuItemComponent
              handleChange={this.handleChange}
              menuItemToShow={this.props.menuItemToShow}
              handleFormClose={this.handleFormClose}
              handleFunction={handleFunction}
              infoText={text}
              infoButton={button}

              errors={this.state.errors}

              inputDataToShow={inputDataToShow}
            />
          </OutsideClick>
        )}
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(CreateMenuItemContainer))