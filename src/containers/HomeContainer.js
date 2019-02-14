import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { Switch, Route, withRouter } from 'react-router-dom';
import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import HomeComponent from '../components/HomeComponent'

const mapStateToProps = store => ({
  roleName: store.aws.roleName,
  podName: store.kubectl.podName
});

const mapDispatchToProps = dispatch => ({
  setNewRole: (text) => {
    dispatch(actions.setRole(text))
  }
});



class App extends Component {
  constructor(props) {
    super(props);
    this.handleChangeScreen = this.handleChangeScreen.bind(this);
    // this.handleNewRole = this.handleNewRole.bind(this);
  }


  //**--------------EVENT HANDLERS-----------------**//

  //CREATE POD HANDLER
  handleChangeScreen(data) {
    console.log('handleChangeScreen Clicked!!!');
    this.props.history.push('/aws')

    // ipcRenderer.send(events.CHANGE_SCREEN, 'changed');
  }



  render() {
    return (
      <div>
        <HomeComponent handleChangeScreen={this.handleChangeScreen}
          
        />
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));