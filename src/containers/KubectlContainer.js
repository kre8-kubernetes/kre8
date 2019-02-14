import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import KubectlTestComponent from '../components/KubectlTestComponent';

const mapStateToProps = store => ({
  roleName: store.aws.roleName,
  podName: store.kubectl.podName,
  deploymentName: store.kubectl.deploymentName,
  serviceName: store.kubectl.serviceName
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

  //CREATE POD HANDLER
  handleCreatePod(data) {
    console.log('handleCreatePod Clicked!!!');
    ipcRenderer.send(events.CREATE_POD, {podName: "mvp"});
  }

  //CREATE DEPLOYMENT HANDLER
  handleCreateDeployment(data) {
    console.log('handleCreateDeployment Clicked!!!');
    ipcRenderer.send(events.CREATE_DEPLOYMENT, {deploymentName: "my-deployment", label: "my-app", podName: "my-pod"});
  }

  //CREATE SERVICE HANDLER
  handleCreateService(data) {
    console.log('handleCreateService Clicked!!!');
    ipcRenderer.send(events.CREATE_SERVICE, {serviceName: "harmon-service", appName: "pandawhale-app"});
  }

  
  
  
  
  
  
  
  
  //**--------------INCOMING DATA FROM MAIN THREAD-----------------**//

  //INCOMING POD DATA
  handleNewPod(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming text:', data);
    this.props.setNewPod(data);
  }

  //INCOMING DEPLOYMENT DATA 
  handleNewDeployment(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming text:', data);
    this.props.setNewDeployment(data);
  }

  //INCOMING SERVICE DATA
  handleNewService(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming text:', data);
    this.props.setNewService(data);
  }















  render() {
    return (
      <div>
        <KubectlTestComponent 
          podName={this.props.podName}
          handleCreatePod={this.handleCreatePod}
          deploymentName={this.props.deploymentName}
          handleCreateDeployment={this.handleCreateDeployment}
          serviceName={this.props.serviceName}
          handleCreateService={this.handleCreateService}

        />
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));