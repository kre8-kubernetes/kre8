import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';

import { Switch, Route, withRouter } from 'react-router-dom';
import SimpleReactValidator from 'simple-react-validator';


import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import HomeComponent from '../components/HomeComponent';
// import InfoComponent from '../components/InfoComponent';

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

    this.validator = new SimpleReactValidator({
      element: (message, className) => <div className="errorClass">{message}</div>
    });

    this.handleChange = this.handleChange.bind(this);
    this.setAWSCredentials = this.setAWSCredentials.bind(this);
    this.handleAWSCredentials = this.handleAWSCredentials.bind(this);
    
    // this.displayInfoHandler = this.displayInfoHandler.bind(this);
    // this.hideInfo = this.hideInfo.bind(this);

    this.testFormValidation = this.testFormValidation.bind(this);
    this.handleFormChange = this.handleFormChange.bind(this);
  }

  //**--------------COMPONENT LIFECYCLE METHODS-----------------**//

  componentDidMount() {
    ipcRenderer.on(events.HANDLE_AWS_CREDENTIALS, this.handleAWSCredentials);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_AWS_CREDENTIALS, this.handleAWSCredentials);
  }

  //**--------------EVENT HANDLERS-----------------**//

  //HANDLE CHANGE METHOD FOR FORMS
  handleChange(e) {
    e.preventDefault();
    console.log("e.target: ", e.target);
    this.setState({ [e.target.name]: e.target.value });
  }

  handleFormChange(e) {
    console.log(e.target.value);
    console.log("state: ", this.state);
    this.setState({ "awsRegion": e.target.value });
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
    if (data.UserId) {
      this.props.history.push('/aws')
    }
  }



  //MORE INFO BUTTON CLICK HANDLER
  //this should tell info component which text to display
  // displayInfoHandler(buttonId){
  //   const home_info = 'In order to use KRE8 to create and launch your Kubernetes cluster on Amazon’s Elastic Container Service for Kubernetes (EKS), you must have an Amazon Web Services Account. KRE8 needs the below details from your AWS account in order to deploy your cluster. KRE8 will use these details to generate a file titled “credentials” in a folder named .aws in your root directory. AWS will reference this file to verify your permissions as you build your Kubernetes cluster.'
  //   const aws_info = ''

  //   if(buttonId === home_info_button){
  //     this.setState({...this.state, text_info: home_info, showInfo: true})
  //   }
  //   if(buttonId === aws_info_button){
  //     this.setState({...this.state, text_info: aws_info, showInfo: true})
  //   }
  // }

  // //HIDE INFO BUTTON CLICK HANDLER
  // hideInfoHandler(){
  //   this.setState({...this.state, showInfo: false})
  // }







  render() { 
    console.log(this.state.awsRegion)

    return (
      <div className="home_page_container">
        <HomeComponent 
          handleChange={this.handleChange}
          handleFormChange={this.handleFormChange}
          validator={this.validator}
          awsAccessKeyId={this.state.awsAccessKeyId}
          awsSecretAccessKey={this.state.awsSecretAccessKey}
          awsRegion={this.state.awsRegion}
          setAWSCredentials={this.setAWSCredentials}

        />
        {/* <InfoComponent 
        //put a boolean in state
          text={this.state.text}
          hideInfo={this.handleInfoHandler}
        /> */}

      </div>
    );
  }
}

export default withRouter(connect(null, null)(HomeContainer));