import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import KubectlTestComponent from '../components/KubectlTestComponent';

const mapStateToProps = store => ({
  roleName: store.aws.roleName,
  podName: store.kubectl.podName
});

const mapDispatchToProps = dispatch => ({
  setNewPod: (data) => {
    dispatch(actions.setPod(data))
  }
});

class App extends Component {
  constructor(props) {
    super(props);
    this.handleCreatePod = this.handleCreatePod.bind(this);
    this.handleNewPod = this.handleNewPod.bind(this);
  }

  // On component mount we will create listeners, so that the main thread can communicate when needed
  componentDidMount() {
    ipcRenderer.on(events.HANDLE_NEW_POD, this.handleNewPod)
  }

  // On component unmount, we will unsubscribe to listeners
  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_NEW_POD, this.handleNewPod);
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
    return (
      <div>
        <KubectlTestComponent 
          podName={this.props.podName}
          handleCreatePod={this.handleCreatePod}
        />
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));