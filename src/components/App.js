import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

const mapStateToProps = store => ({
  roleName: store.aws.roleName,
  podName: store.kubectl.podName
});

const mapDispatchToProps = dispatch => ({
  setNewRole: (text) => {
    dispatch(actions.setRole(text))
  },
  setNewPod: (data) => {
    dispatch(actions.setPod(data))
  }
});

class App extends Component {
  constructor(props) {
    super(props);
    this.handleCreateRole = this.handleCreateRole.bind(this);
    this.handleCreatePod = this.handleCreatePod.bind(this);
    this.handleNewRole = this.handleNewRole.bind(this);
    this.handleNewPod = this.handleNewPod.bind(this);
  }

  // On component mount we will create listeners, so that the main thread can communicate when needed
  componentDidMount() {
    ipcRenderer.on(events.HANDLE_NEW_ROLE, this.handleNewRole)
    ipcRenderer.on(events.HANDLE_NEW_POD, this.handleNewPod)
  }

  // On component unmount, we will unsubscribe to listeners
  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_NEW_ROLE, this.handleNewRole);
    ipcRenderer.removeListener(events.HANDLE_NEW_POD, this.handleNewPod);
  }

  // Handlers to trigger events that will take place in the main thread
  handleCreateRole(data) {
    console.log('handleCreateRole Clicked!!!');
    ipcRenderer.send(events.CREATE_IAM_ROLE, 'hello');
  }

  handleNewRole(event, text) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming text:', text);
    this.props.setNewRole(text);
  }

  handleCreatePod(data) {
    console.log('handleCreatePod Clicked!!!');
    ipcRenderer.send(events.CREATE_POD, 'hello2');
  }

  handleNewPod(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming text:', data);
    this.props.setNewPod(data);
  }

  render() {
    console.log(this.props);

    return (
      <div>
        <button onClick={this.handleCreateRole}>Create a ROLE</button>
        <button onClick={this.handleCreatePod}>Create a POD</button>
        <ul>
          <li>{this.props.roleName}</li>
          <li>{this.props.podName}</li>
        </ul>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);