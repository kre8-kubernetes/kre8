import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import KubectlTestComponent from '../components/KubectlTestComponent';

const mapStateToProps = store => ({
  roleName: store.aws.roleName,
  pods: store.kubectl.pods,
  deployments: store.kubectl.deployments,
  services: store.kubectl.services,
  // deploymentName: store.kubectl.deploymentName,
  // serviceName: store.kubectl.serviceName
});

const mapDispatchToProps = dispatch => ({
  setNewPod: (data) => {
    dispatch(actions.setPod(data))
  },
  setNewDeployment: (data) => {
    dispatch(actions.setDeployment(data))
  },
  setNewService: (data) => {
    dispatch(actions.setService(data))
  }

});

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pod_podName: '',
      pod_containerName: '',
      pod_imageName: '',

      deployment_deploymentName: '',
      deployment_appName: '',
      deployment_containerName: '',
      deployment_image: '',
      deployment_containerPort: '',
      deployment_replicas: '',

      service_name: '',
      service_appName: '',
      service_port: '',
      service_targetPort: ''
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

  // POD LIFECYCLE METHOD - On component mount we will create listeners, so that the main thread can communicate when needed
  componentDidMount() {
    ipcRenderer.on(events.HANDLE_NEW_POD, this.handleNewPod)
  }

  // On component unmount, we will unsubscribe to listeners
  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_NEW_POD, this.handleNewPod);
  }


  // DEPLOYMENT LIFECYCLE METHOD
  componentDidMount() {
    ipcRenderer.on(events.HANDLE_NEW_DEPLOYMENT, this.handleNewDeployment)
  }

  // On component unmount, we will unsubscribe to listeners
  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_NEW_DEPLOYMENT, this.handleNewDeployment);
  }


    // SERVICE LIFECYCLE METHOD
    componentDidMount() {
      ipcRenderer.on(events.HANDLE_NEW_SERVICE, this.handleNewService)
    }
  
    // On component unmount, we will unsubscribe to listeners
    componentWillUnmount() {
      ipcRenderer.removeListener(events.HANDLE_NEW_SERVICE, this.handleNewService);
    }





  //**--------------EVENT HANDLERS-----------------**//

  //HANDLE CHANGE METHOD FOR FORMS
  handleChange(e) {
    e.preventDefault();
    const newState = this.state;
    newState[e.target.id] = e.target.value;
    this.setState(newState);
  };


  //CREATE POD HANDLER
  handleCreatePod(data) {
    console.log('handleCreatePod Clicked!!!');
    const obj = {
      podName: this.state.pod_podName,
      containerName: this.state.pod_containerName,
      imageName: this.state.pod_imageName,
    }
    ipcRenderer.send(events.CREATE_POD, obj);
  }

  //CREATE DEPLOYMENT HANDLER
  handleCreateDeployment(data) {
    console.log('handleCreateDeployment Clicked!!!');
    const obj = {
      deploymentName: this.state.deployment_deploymentName,
      appName: this.state.deployment_appName,
      containerName: this.state.deployment_containerName,
      image: this.state.deployment_image,
      containerPort: this.state.deployment_containerPort,
      replicas: this.state.deployment_replicas
    }
    ipcRenderer.send(events.CREATE_DEPLOYMENT, obj);
  }

  //CREATE SERVICE HANDLER
  handleCreateService(data) {
    console.log('handleCreateService Clicked!!!');
    const obj = {
      name: this.state.service_name,
      appName: this.state.service_appName,
      port: this.state.service_port,
      targetPort: this.state.service_targetPort
    }
    ipcRenderer.send(events.CREATE_SERVICE, obj);
  }


  
  //**--------------INCOMING DATA FROM MAIN THREAD-----------------**//

  //INCOMING POD DATA
  handleNewPod(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming text:', data);
    const obj = {
      podName: this.state.pod_podName,
      containerName: this.state.pod_containerName,
      imageName: this.state.pod_imageName,
    }    
    this.props.setNewPod(obj);
    const newState = this.state;
    newState.pod_podName = '';
    newState.pod_containerName = '';
    newState.pod_imageName = '';
    this.setState(newState);
  }
  
  
  // //INCOMING POD DATA
  // handleNewPod(event, data) {
  //   // The following is going to be the logic that occurs once a new role was created via the main thread process
  //   console.log('incoming text:', data);
  //   this.props.setNewPod(data);
  // }

  //INCOMING DEPLOYMENT DATA 
  handleNewDeployment(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming text:', data);
    const obj = {
      deploymentName: this.state.deployment_deploymentName,
      appName: this.state.deployment_appName,
      containerName: this.state.deployment_containerName,
      image: this.state.deployment_image,
      containerPort: this.state.deployment_containerPort,
      replicas: this.state.deployment_replicas
    }    
    this.props.setNewDeployment(obj);
    const newState = this.state;
    newState.deployment_deploymentName = '';
    newState.deployment_appName = '';
    newState.deployment_containerName = '';
    newState.deployment_image = '';
    newState.deployment_containerPort = '';
    newState.deployment_replicas = '';
    this.setState(newState);
  }


  //INCOMING SERVICE DATA
  handleNewService(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming text:', data);
    const obj = {
      name: this.state.service_name,
      appName: this.state.service_appName,
      containerName: this.state.service_containerName,
      image: this.state.service_image,
      replicas: this.state.service_replicas
    }    
    this.props.setNewService(obj);
    const newState = this.state;
    newState.service_name = '';
    newState.service_appName = '';
    newState.service_containerName = '';
    newState.service_image = '';
    newState.service_replicas = '';
    this.setState(newState);
  }


  render() {
    return (
      <div>
        <KubectlTestComponent
          handleChange={this.handleChange}
          handleCreatePod={this.handleCreatePod}
          handleCreateDeployment={this.handleCreateDeployment}
          handleCreateService={this.handleCreateService}

          pod_podName={this.state.pod_podName}
          pod_containerName={this.state.pod_containerName}
          pod_imageName={this.state.pod_imageName}

          deployment_deploymentName={this.state.deployment_deploymentName}
          deployment_appName={this.state.deployment_appName}
          deployment_containerName={this.state.deployment_containerName}
          deployment_image={this.state.deployment_image}
          deployment_containerPort={this.state.deployment_containerPort}
          deployment_replicas={this.state.deployment_replicas}

          service_serviceName={this.state.service_serviceName}
          service_appName={this.state.service_appName}
          service_containerName={this.state.service_containerName}
          service_image={this.state.service_image}
          service_replicas={this.state.service_replicas}

          pods={this.props.pods}
          deployments={this.props.deployments}
          services={this.props.services}


        />
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));