import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';
import * as yup from 'yup';

import HomeComponent from '../components/HomeComponent';
import HelpInfoComponent from '../components/HelpInfoComponent';
import HomeComponentPostCredentials from '../components/HomeComponentPostCredentials';

// import SimpleReactValidator from 'simple-react-validator';


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

  setCredentialStatusFalse: () => {
    dispatch(actions.setCheckCredentialsFalse())
  },

  setCheckCredentialsTrue: () => {
    dispatch(actions.setCheckCredentialsTrue())
  },

  // setCheckCredentialsFalse: () => {
  //   dispatch(actions.setCheckCredentialsFalse())
  // }
});



class HomeContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      awsAccessKeyId: '',
      awsSecretAccessKey: '',
      awsRegion: 'default',
      text_info:'',
      showInfo: false,
      mouseCoords: {},
      credentialStatus: false,

      errors: {},
      display_error: false,
    }

    // this.validator = new SimpleReactValidator({
    //   element: (message, className) => <div className="errorClass">{message}</div>
    // });

    this.handleChange = this.handleChange.bind(this);
    this.setAWSCredentials = this.setAWSCredentials.bind(this);
    this.handleAWSCredentials = this.handleAWSCredentials.bind(this);
    this.processAWSCredentialStatus = this.processAWSCredentialStatus.bind(this);
    
    this.displayInfoHandler = this.displayInfoHandler.bind(this);
    this.hideInfoHandler = this.hideInfoHandler.bind(this);

    // this.testFormValidation = this.testFormValidation.bind(this);
    this.handleFormChange = this.handleFormChange.bind(this);
    // this.handleButtonClickOnHomeComponentPostCredentials = this.handleButtonClickOnHomeComponentPostCredentials.bind(this);
  }

  //**--------------COMPONENT LIFECYCLE METHODS-----------------**//

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

  //**--------------EVENT HANDLERS-----------------**//

  //HANDLE CHANGE METHOD FOR FORMS
  handleChange(e) {
    e.preventDefault();
    this.setState({ [e.target.name]: e.target.value });
  }

  handleFormChange(e) {
    this.setState({ "awsRegion": e.target.value });
  }

  //TODO replace form validation
  // testFormValidation() {
  //   if (this.validator.allValid()) {
  //     return true;
  //   } else {
  //     this.validator.showMessages();
  //     this.forceUpdate();
  //     return false;
  //   }
  //}

  //** ------- PROCESS AWS CREDENTIALS ON APPLICATION OPEN ----------- **//

  //check if credentials are already saved in file, signifying a user has previously logged into the application successfully, and if so display Loading Page until advanced to Cluster Display Page. Otherwise, take user to page to enter AWS credentials for the first time.

  processAWSCredentialStatus(event, data) {

    if (data === true) {
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

    // const awsConfigData = {
    //   awsAccessKeyId: this.state.awsAccessKeyId,
    //   awsSecretAccessKey: this.state.awsSecretAccessKey,
    //   awsRegion: this.state.awsRegion
    // }

    const awsCredentials = {
      awsAccessKeyId: this.state.awsAccessKeyId,
      awsSecretAccessKey: this.state.awsSecretAccessKey,
      awsRegion: this.state.awsRegion
    }
  
    const awsCredentialsSchema = yup.object().strict().shape({
      awsAccessKeyId: yup.string().required().min(15).max(40),
      awsSecretAccessKey: yup.string().required().min(30).max(50),
      // awsRegion: yup.string().required(),
      awsRegion: yup.mixed().required().notOneOf(['default'])
    })
    awsCredentialsSchema.validate(awsCredentials, { abortEarly: false })
      .then((data) => {
        console.log('from the awsAccessKey', data)
        this.setState({ ...this.state, awsAccessKeyId: '', awsSecretAccessKey: '', awsRegion: '', errors: {} })

        console.log("ready to send data")
        // ipcRenderer.send(events.SET_AWS_CREDENTIALS, awsCredentials);
      })
      .catch((err) => {
        console.log('err', err);
        const errorObj = err.inner.reduce((acc, error, i) => {
          acc[error.path] = error.message;
          return acc;
       }, {});
       this.setState({ ...this.state, errors: errorObj })
      })
    }



    // if (this.testFormValidation()) {
    //   console.log("All form data passed validation");
    //   this.setState({ ...this.state, awsAccessKeyId: '', awsSecretAccessKey: '', awsRegion: ''});
    //   // ipcRenderer.send(events.SET_AWS_CREDENTIALS, awsConfigData);
    // } else {
    //   console.log("Invalid or missing data entry");
    // }
    
  

  //Based on AWS response, either move the user on to the AWS data entry page, or send error alert, for user to reenter credentials
  handleAWSCredentials(event, data) {
    
    if (data.Arn) {
      this.props.history.push('/aws')

    } else {

      //TODO: convert alert
      alert('The credentials you entered are incorrect. Please check your entries and try again.');
    }
  }

  //TODO delete, no longer necessary: 

  // handleButtonClickOnHomeComponentPostCredentials(e) {
  //   this.props.history.push('/cluster')
  // }

  // MORE INFO BUTTON CLICK HANDLER
  // this should tell info component which text to display
  displayInfoHandler(e){
    const home_info = 'In order to use KRE8 to create and launch your Kubernetes cluster on Amazon’s Elastic Container Service for Kubernetes (EKS), you must have an Amazon Web Services Account. KRE8 needs the below details from your AWS account in order to deploy your cluster. KRE8 will use these details to generate a file titled “credentials” in a folder named .aws in your root directory. AWS will reference this file to verify your permissions as you build your Kubernetes cluster.'
    const x = e.screenX;
    const y = e.screenY;
    const newCoords = {top: y, left: x}
    this.setState({...this.state, text_info: home_info, mouseCoords: newCoords, showInfo: true})
  }

  //HIDE INFO BUTTON CLICK HANDLER
  hideInfoHandler(){
    this.setState({...this.state, showInfo: false})
  }

  render() { 

    console.log('this.state.awsRegion', this.state.awsRegion);
    console.log("this.state inside home container: ", this.state)

    return (
      <div className="home_page_container">
        {this.state.showInfo === true && (
        <HelpInfoComponent 
          text_info={this.state.text_info}
          hideInfoHandler={this.hideInfoHandler}
          mouseCoords={this.state.mouseCoords}
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
            awsAccessKeyId={this.state.awsAccessKeyId}
            awsSecretAccessKey={this.state.awsSecretAccessKey}
            awsRegion={this.state.awsRegion}
            setAWSCredentials={this.setAWSCredentials} 
            displayInfoHandler={this.displayInfoHandler}
            grabCoords={this.grabCoords}
            errors={this.state.errors}
          />

        }
    </div>
    );
  }
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(HomeContainer));

