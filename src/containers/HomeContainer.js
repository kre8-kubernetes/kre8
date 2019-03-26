import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';

import * as yup from 'yup';
import { setLocale } from 'yup';


import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import HomeComponent from '../components/HomeComponent';
import HelpInfoComponent from '../components/HelpInfoComponent';
import HomeComponentPostCredentials from '../components/HomeComponentPostCredentials';


//** -------------- REDUX ----------------------------------- **//

const mapStateToProps = (store) => ({
  credentialStatus: store.aws.credentialStatus,
  hasCheckedCredentials: store.aws.hasCheckedCredentials
})

const mapDispatchToProps = dispatch => ({
  hideCreateButton: () => {
    dispatch(actions.hideCreateButton())
  },

  setCredentialStatusTrue: () => {
    dispatch(actions.setCredentialStatusTrue())
  },

  setCheckCredentialsTrue: () => {
    dispatch(actions.setCheckCredentialsTrue())
  },

});



class HomeContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      awsAccessKeyId: '',
      awsSecretAccessKey: '',
      awsRegion: 'default',

      textInfo:'',
      showInfo: false,
      mouseCoords: {},
      credentialStatus: false,

      errors: {},
      displayError: false,
    }

    //TODO: do we use displayError?

    this.handleChange = this.handleChange.bind(this);
    this.setAWSCredentials = this.setAWSCredentials.bind(this);
    this.handleAWSCredentials = this.handleAWSCredentials.bind(this);
    this.processAWSCredentialStatus = this.processAWSCredentialStatus.bind(this);
    
    this.displayInfoHandler = this.displayInfoHandler.bind(this);
    this.hideInfoHandler = this.hideInfoHandler.bind(this);

    this.handleFormChange = this.handleFormChange.bind(this);
  }

  //** -------------- COMPONENT LIFECYCLE METHODS ----------------- **//

  componentDidMount() {

    if (!this.props.hasCheckedCredentials) {
      ipcRenderer.send(events.CHECK_CREDENTIAL_STATUS, "checking for credentials");
    };

    ipcRenderer.on(events.RETURN_CREDENTIAL_STATUS, this.processAWSCredentialStatus);
    ipcRenderer.on(events.HANDLE_AWS_CREDENTIALS, this.handleAWSCredentials);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_AWS_CREDENTIALS, this.handleAWSCredentials);
  }

  //** -------------- EVENT HANDLERS ------------------------------ **//

  //Method handling text changes for form input fields
  handleChange(e) {
    e.preventDefault();
    this.setState({ [e.target.name]: e.target.value });
  }

  handleFormChange(e) {
    this.setState({ "awsRegion": e.target.value });
  }



  //** ------- PROCESS AWS CREDENTIALS ON APPLICATION OPEN ----------- **//

  //Check if credentials are already saved in file, signifying a user has previously logged into the application successfully, and if so display Loading Page until advanced to Cluster Display Page. Otherwise, take user to Home Page to enter AWS credentials for the first time.

  processAWSCredentialStatus(event, data) {

    console.log("credential status data: ", data);

    if (data === true) {
      (console.log("status is true"))
      this.props.setCredentialStatusTrue();
      this.props.history.push('/cluster');
    } else {
      this.props.setCredentialStatusFalse();
    }

    this.props.setCheckCredentialsTrue();
  }

  //** ------- CONFIGURE AWS CREDENTIALS ----------------------------- **//
  //Activates when user enters AWS credentials. If the credentials pass error handlers, reset values in state, and send data to the main thread to verify entry data with AWS

  setAWSCredentials(e) {
    e.preventDefault();

    const awsCredentials = {
      awsAccessKeyId: this.state.awsAccessKeyId,
      awsSecretAccessKey: this.state.awsSecretAccessKey,
      awsRegion: this.state.awsRegion
    }

    setLocale({
      mixed: {
        notOneOf: 'AWS Region is required',
      },
      string: {
        min: 'Please enter a valid AWS credential',
        max: 'Please enter a valid AWS credential',
      },
    });
  
    const awsCredentialsSchema = yup.object().strict().shape({
      awsAccessKeyId: yup.string().required('Please enter a valid AWS Access Key Id').min(15).max(40),
      awsSecretAccessKey: yup.string().required('Please enter a valid AWS Secret Access Key').min(30).max(50),
      awsRegion: yup.mixed().required('AWS Region is required').notOneOf(['default'])
    })
    awsCredentialsSchema.validate(awsCredentials, { abortEarly: false })
      .then((data) => {
        console.log("!!!!!!!!!!!!!!!!!!!!!!error didnt ocurr")
        console.log("data: ", data);
        this.setState({ ...this.state, awsAccessKeyId: '', awsSecretAccessKey: '', awsRegion: '', errors: {} })

        console.log("ready to send data")
        //TODO: uncomment this
        // ipcRenderer.send(events.SET_AWS_CREDENTIALS, awsCredentials);
      })
      .catch((err) => {
        console.log("!!!!!!!!!!!!!!!!!!!!!!error ocurred")
        console.log('err', err);
        const errorObj = err.inner.reduce((acc, error, i) => {
          acc[error.path] = error.message;
          return acc;
       }, {});
       this.setState({ ...this.state, errors: errorObj })
      })
    }
    

  //Based on AWS response, either move the user on to the AWS data entry page, or send error alert, for user to reenter credentials
  handleAWSCredentials(event, data) {
    
    if (data.Arn) {
      this.props.history.push('/aws')

    } else {

      //TODO: convert alert
      alert('The credentials you entered are incorrect. Please check your entries and try again.');
    }
  }

  
  // MORE INFO BUTTON CLICK HANDLER
  // this should tell info component which text to display
  displayInfoHandler(e){
    const home_info = 'In order to use KRE8 to create and launch your Kubernetes cluster on Amazon’s Elastic Container Service for Kubernetes (EKS), you must have an Amazon Web Services Account. KRE8 needs the below details from your AWS account in order to deploy your cluster. KRE8 will use these details to generate a file titled “credentials” in a folder named .aws in your root directory. AWS will reference this file to verify your permissions as you build your Kubernetes cluster.'
    const x = e.screenX;
    const y = e.screenY;
    const newCoords = {top: y, left: x}
    this.setState({...this.staI, textInfo: home_info, mouseCoords: newCoords, showInfo: true})
  }

  //HIDE INFO BUTTON CLICK HANDLER
  hideInfoHandler(){
    this.setState({...this.state, showInfo: false})
  }

  render() { 

    console.log('this.state.awsRegion', this.state.awsRegion);
    console.log("this.state inside home container: ", this.state)

    const {
      awsAccessKeyId,
      awsSecretAccessKey,
      awsRegion,

      textInfo,
      showInfo,
      mouseCoords,

      errors,
      displayError,
    } = this.state;


    return (
      <div className="home_page_container">
        {showInfo === true && (
        <HelpInfoComponent 
    I  textInfo={textInfo}
          hideInfoHandler={this.hideInfoHandler}
          mouseCoords={mouseCoords}
        />
        )}

        { ((this.props.hasCheckedCredentials === false) && (this.props.credentialStatus === true)) ?

          <HomeComponentPostCredentials
            handleButtonClickOnHomeComponentPostCredentials={this.handleButtonClickOnHomeComponentPostCredentials}
          />

          :
        
          <HomeComponent 
            handleChange={this.handleChange}
            handleFormChange={this.handleFormChange}

            awsAccessKeyId={awsAccessKeyId}
            awsSecretAccessKey={awsSecretAccessKey}
            awsRegion={awsRegion}
            errors={errors}

            setAWSCredentials={this.setAWSCredentials} 

            displayInfoHandler={this.displayInfoHandler}
            grabCoords={this.grabCoords}
          />
        }
        
    </div>
    );
  }
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(HomeContainer));

