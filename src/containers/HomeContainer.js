import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';

import { Switch, Route, withRouter } from 'react-router-dom';
import SimpleReactValidator from 'simple-react-validator';


import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import HomeComponent from '../components/HomeComponent'

class HomeContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      awsAccessKeyId: '',
      awsSecretAccessKey: '',
      awsRegion: ''
    }

    this.validator = new SimpleReactValidator({
      element: (message, className) => <div className="errorClass">{message}</div>
    });

    this.handleChange = this.handleChange.bind(this);
    this.setAWSCredentials = this.setAWSCredentials.bind(this);
    this.handleAWSCredentials = this.handleAWSCredentials.bind(this);
    this.testFormValidation = this.testFormValidation.bind(this);
  }

  //**--------------COMPONENT LIFECYCLE METHODS-----------------**//

  componentDidMount() {
    ipcRenderer.on(events.HANDLE_AWS_CREDENTIALS, this.handleAWSCredentials);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_AWS_CREDENTIALSE, this.handleAWSCredentials);
  }

  //**--------------EVENT HANDLERS-----------------**//

  //HANDLE CHANGE METHOD FOR FORMS
  handleChange(e) {
    e.preventDefault();
    this.setState({ [e.target.name]: e.target.value });
  }

  testFormValidation() {
    if (this.validator.allValid()) {
      alert('Your credentials are bring validated by Amazon Web Services. This can take up to one minute.');
      return true;
    } else {
      this.validator.showMessages();
      this.forceUpdate();
      return false;
    }
  }


  //** ------- CONFIGURE AWS CREDENTIALS --------------------- **//
  setAWSCredentials(e) {
    e.preventDefault();
    console.log('handle aws credentials clicked!!!');
    
    const awsConfigData = {
      awsAccessKeyId: this.state.awsAccessKeyId,
      awsSecretAccessKey: this.state.awsSecretAccessKey,
      awsRegion: this.state.awsRegion
    }

    if (this.testFormValidation()) {
      console.log("All form data passed validation");
      this.setState({ ...this.state, awsAccessKeyId: '', awsSecretAccessKey: '', awsRegion: ''});
      ipcRenderer.send(events.SET_AWS_CREDENTIALS, awsConfigData);
    }

    console.log("Invalid or missing data entry");
  }

  handleAWSCredentials(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming text:', data);
    this.props.history.push('/aws')
    // this.props.setNewRole(data);
  }



  render() {
    return (
      <div className="home_page_container">
        <HomeComponent 
          handleChange={this.handleChange}
          validator={this.validator}
          awsAccessKeyId={this.state.awsAccessKeyId}
          awsSecretAccessKey={this.state.awsSecretAccessKey}
          awsRegion={this.state.awsRegion}
          setAWSCredentials={this.setAWSCredentials}
          handleAWSCredentials={this.handleAWSCredentials}
        />
      </div>
    );
  }
}

export default withRouter(connect(null, null)(HomeContainer));