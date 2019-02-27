import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { Switch, Route, withRouter } from 'react-router-dom';

import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import HomeComponent from '../components/HomeComponent'

class HomeContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      awsAccessKeyId: '',
      awsSecretAccessKey: '',
      awsRegion: '',

      // home_info: 'In order to use KRE8 to create and launch your Kubernetes cluster on Amazon’s Elastic Container Service for Kubernetes (EKS), you must have an Amazon Web Services Account.' 
      // '\n KRE8 needs the below details from your AWS account in order to deploy your cluster. KRE8 will use these details to generate a file titled “credentials” in a folder named .aws in your root directory.' 
      // '\n AWS will reference this file to verify your permissions as you build your Kubernetes cluster.',
      // aws_info: '',
    }
    this.handleChange = this.handleChange.bind(this);
    this.setAWSCredentials = this.setAWSCredentials.bind(this);
    this.handleAWSCredentials = this.handleAWSCredentials.bind(this);
  }

  handleChange(e) {
    e.preventDefault();
    this.setState({ [e.target.name]: e.target.value });
  }

  componentDidMount() {
    ipcRenderer.on(events.HANDLE_AWS_CREDENTIALS, this.handleAWSCredentials);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_AWS_CREDENTIALS, this.handleAWSCredentials);
  }

  //** ------- CONFIGURE AWS CREDENTIALS --------------------- **//
  setAWSCredentials(e) {
    e.preventDefault();
  
    const awsConfigData = {
      awsAccessKeyId: this.state.awsAccessKeyId,
      awsSecretAccessKey: this.state.awsSecretAccessKey,
      awsRegion: this.state.awsRegion
    }
    this.setState({ ...this.state, awsAccessKeyId: '', awsSecretAccessKey: '', awsRegion: ''})
    ipcRenderer.send(events.SET_AWS_CREDENTIALS, awsConfigData);
  }

  handleAWSCredentials(event, data) {
    // The following is going to be the logic that occurs once a new role was created via the main thread process
    console.log('incoming text:', data);
    if (data.UserId) {
      this.props.history.push('/aws')
    }
  }

  render() {
    return (
      <div className="home_page_container">
        <HomeComponent 
          handleChange={this.handleChange}
          awsAccessKeyId={this.state.awsAccessKeyId}
          awsSecretAccessKey={this.state.awsSecretAccessKey}
          awsRegion={this.state.awsRegion}
          setAWSCredentials={this.setAWSCredentials}
        />
        {/* <InfoComponent 
          home_info={this.state.home_info}
        /> */}

      </div>
    );
  }
}

export default withRouter(connect(null, null)(HomeContainer));