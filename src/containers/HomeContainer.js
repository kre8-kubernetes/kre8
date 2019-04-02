import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';

// Form error handling with Yup
import { setLocale, object, string, mixed } from 'yup';

import * as actions from '../store/actions/actions';
import * as events from '../../eventTypes';

import HomeComponent from '../components/HomeComponent';
import HelpInfoComponent from '../components/HelpInfoComponent';
import HomeComponentPostCredentials from '../components/HomeComponentPostCredentials';

// TODO: do we use displayError from state?
// TODO: Convert alert

//* --------------- STATE + ACTIONS FROM REDUX ----------------- *//
const mapStateToProps = store => ({
  credentialStatus: store.aws.credentialStatus,
  hasCheckedCredentials: store.aws.hasCheckedCredentials,
});

const mapDispatchToProps = dispatch => ({
  hideCreateButton: () => {
    dispatch(actions.hideCreateButton());
  },
  setCredentialStatusTrue: () => {
    dispatch(actions.setCredentialStatusTrue());
  },
  setCredentialStatusFalse: () => {
    dispatch(actions.setCredentialStatusFalse());
  },
  setCheckCredentialsTrue: () => {
    dispatch(actions.setCheckCredentialsTrue());
  },
});


//* -------------- HOME CONTAINER COMPONENT ----------------------------------- *//
class HomeContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      awsAccessKeyId: '',
      awsSecretAccessKey: '',
      awsRegion: 'default',

      textInfo: '',
      showInfo: false,
      mouseCoords: {},
      credentialStatus: false,

      errors: {},
      displayError: false,
      credentialError: '',
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleFormChange = this.handleFormChange.bind(this);

    this.setAWSCredentials = this.setAWSCredentials.bind(this);
    this.handleAWSCredentials = this.handleAWSCredentials.bind(this);
    this.processAWSCredentialStatus = this.processAWSCredentialStatus.bind(this);

    this.displayInfoHandler = this.displayInfoHandler.bind(this);
    this.hideInfoHandler = this.hideInfoHandler.bind(this);
  }

  //* -------------- COMPONENT LIFECYCLE METHODS
  componentDidMount() {
    const { hasCheckedCredentials } = this.props;
    if (!hasCheckedCredentials) {
      ipcRenderer.send(events.CHECK_CREDENTIAL_STATUS, 'Checking for credentials');
    }
    ipcRenderer.on(events.RETURN_CREDENTIAL_STATUS, this.processAWSCredentialStatus);
    ipcRenderer.on(events.HANDLE_AWS_CREDENTIALS, this.handleAWSCredentials);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_AWS_CREDENTIALS, this.handleAWSCredentials);
  }

  //* ------------ CONFIGURE AWS CREDENTIALS -------------------------------- **//
  /*
  * Activates when user enters AWS credentials. If the credentials pass error handlers,
  * reset values in state, and send data to the Main thread to verify entry data with AWS
  */
  setAWSCredentials(e) {
    e.preventDefault();
    const { awsAccessKeyId, awsSecretAccessKey, awsRegion } = this.state;
    const awsCredentials = {
      awsAccessKeyId,
      awsSecretAccessKey,
      awsRegion,
    };

    // Create custom instructions for Yup error handling
    setLocale({
      mixed: { notOneOf: 'AWS Region is required' },
      string: {
        min: 'Please enter a valid AWS credential',
        max: 'Please enter a valid AWS credential',
      },
    });
    // Define Yup Error Schema
    const awsCredentialsSchema = object().strict().shape({
      awsAccessKeyId: string().required('Please enter a valid AWS Access Key Id').min(15).max(40),
      awsSecretAccessKey: string().required('Please enter a valid AWS Secret Access Key').min(30).max(50),
      awsRegion: mixed().required('AWS Region is required').notOneOf(['default']),
    });

    awsCredentialsSchema.validate(awsCredentials, { abortEarly: false })
      .then((data) => {
        this.setState(prevState => ({
          ...prevState,
          awsAccessKeyId: '',
          awsSecretAccessKey: '',
          awsRegion: '',
          errors: {},
        }));
        ipcRenderer.send(events.SET_AWS_CREDENTIALS, awsCredentials);
      })
      .catch((err) => {
        const errorObj = err.inner.reduce((acc, error) => {
          acc[error.path] = error.message;
          return acc;
        }, {});
        this.setState(prevState => ({
          ...prevState,
          errors: errorObj,
        }));
      });
  }

  //* ------------- PROCESS AWS CREDENTIALS ON APPLICATION OPEN ----------- *//
  /*
  * Check if credentials are already saved in file, signifying a user has previously logged
  * into the application successfully, and if so display Loading Page until advanced to
  * Cluster Display Page. Otherwise, take user to Home Page to enter AWS credentials for
  * the first time.
  */

  processAWSCredentialStatus(event, data) {
    const {
      setCredentialStatusTrue,
      setCredentialStatusFalse,
      setCheckCredentialsTrue,
      history,
    } = this.props;
    if (data === true) {
      setCredentialStatusTrue();
      history.push('/cluster');
    } else {
      setCredentialStatusFalse();
    }
    setCheckCredentialsTrue();
  }

  /*
  * Based on AWS response, either move the user on to the AWS data entry page,
  * or display error alert, for user to reenter credentials
  */
  handleAWSCredentials(event, data) {
    const { history } = this.props;
    const credentialData = data;
    if (credentialData.Arn) {
      history.push('/aws');
    } else {
      this.setState(prevState => ({ ...prevState, displayError: true, credentialError: credentialData }));
    }
  }

  //* -------------- FORM EVENT HANDLER METHODS
  // Handles text changes from form input fields
  handleChange(e) {
    const { id, value } = e.target;
    e.preventDefault();
    this.setState(prevState => ({ ...prevState, [id]: value }));
  }

  // Handles region selection from dropdown menu
  handleFormChange(e) {
    const { value } = e.target;
    this.setState(prevState => ({ ...prevState, awsRegion: value }));
  }

  //* --------- DISPLAY MORE INFO ( ? ) COMPONENT METHOD
  displayInfoHandler(e) {
    const homeInfo = 'In order to use KRE8 to create and launch your Kubernetes cluster on Amazon’s Elastic Container Service for Kubernetes (EKS), you must have an Amazon Web Services Account. KRE8 needs the below details from your AWS account in order to deploy your cluster. KRE8 will use these details to generate a file titled “credentials” in a folder named .aws in your root directory. AWS will reference this file to verify your permissions as you build your Kubernetes cluster.';
    const x = e.screenX;
    const y = e.screenY;
    const newCoords = { top: y, left: x };
    this.setState(prevState => ({
      ...prevState,
      textInfo: homeInfo,
      mouseCoords: newCoords,
      showInfo: true,
    }));
  }

  //* --------- HIDE MORE INFO ( ? ) COMPONENT METHOD
  hideInfoHandler() {
    this.setState(prevState => ({
      ...prevState,
      showInfo: false,
    }));
  }

  //* --------- RENDER METHOD
  render() {
    const {
      awsAccessKeyId,
      awsSecretAccessKey,
      awsRegion,
      textInfo,
      showInfo,
      mouseCoords,
      errors,
      credentialError,
      displayError,
    } = this.state;

    const {
      hasCheckedCredentials,
      credentialStatus,
    } = this.props;

    //* --------- RETURN
    return (
      <div className="home_page_container">
        {showInfo === true && (
        <HelpInfoComponent
          textInfo={textInfo}
          mouseCoords={mouseCoords}
          hideInfoHandler={this.hideInfoHandler}
        />
        )}

        {((hasCheckedCredentials === false) && (credentialStatus === true))
          ? <HomeComponentPostCredentials handleButtonClickOnHomeComponentPostCredentials={this.handleButtonClickOnHomeComponentPostCredentials} />
          : (
            <HomeComponent
              handleChange={this.handleChange}
              handleFormChange={this.handleFormChange}
              setAWSCredentials={this.setAWSCredentials}

              displayInfoHandler={this.displayInfoHandler}
              grabCoords={this.grabCoords}

              awsAccessKeyId={awsAccessKeyId}
              awsSecretAccessKey={awsSecretAccessKey}
              awsRegion={awsRegion}
              errors={errors}
              credentialError={credentialError}
              displayError={displayError}
            />
          )
        }
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(HomeContainer));
