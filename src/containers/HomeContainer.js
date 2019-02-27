import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { Switch, Route, withRouter } from 'react-router-dom';

import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import HomeComponent from '../components/HomeComponent';
import InfoComponent from '../components/InfoComponent';

class HomeContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      awsAccessKeyId: '',
      awsSecretAccessKey: '',
      awsRegion: '',

      text_info:'',
      showInfo: false
    }
    this.handleChange = this.handleChange.bind(this);
    this.setAWSCredentials = this.setAWSCredentials.bind(this);
    this.handleAWSCredentials = this.handleAWSCredentials.bind(this);
    
    this.displayInfoHandler = this.displayInfoHandler.bind(this);
    this.hideInfo = this.hideInfo.bind(this);
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


  //MORE INFO BUTTON CLICK HANDLER
  //this should tell info component which text to display
  displayInfoHandler(buttonId){
    const home_info = 'In order to use KRE8 to create and launch your Kubernetes cluster on Amazon’s Elastic Container Service for Kubernetes (EKS), you must have an Amazon Web Services Account. KRE8 needs the below details from your AWS account in order to deploy your cluster. KRE8 will use these details to generate a file titled “credentials” in a folder named .aws in your root directory. AWS will reference this file to verify your permissions as you build your Kubernetes cluster.'
    const aws_info = ''

    if(buttonId === home_info_button){
      this.setState(...this.state, text_info: home_info, showInfo: true)
    }
    if(buttonId === aws_info_button){
      this.setState(...this.state, text_info: aws_info, showInfo: true)
    }
  }

  //HIDE INFO BUTTON CLICK HANDLER
  hideInfoHandler(){
    this.setState(...this.state, showInfo: false;)
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
        <InfoComponent 
        //put a boolean in state
          text={this.state.text}
          hideInfo={this.handleInfoHandler}
        />

      </div>
    );
  }
}

export default withRouter(connect(null, null)(HomeContainer));