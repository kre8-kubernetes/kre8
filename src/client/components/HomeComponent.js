import React from 'react';
import ActionButton from './Buttons/ActionButton';
import HelpInfoButton from './Buttons/HelpInfoButton';
import kre8Logo from '../styles/assets/images/Kre8Logo.png';

/** ------------ HOME COMPONENT ------------------------------
  ** Rendered by the HomeContainer
  * First element user sees upon inital interaction with the application
  * Features a form requesting AWS account credentials
  * User can navigate back to the screen via Nav bar to enter new credentials
*/

const HomeComponent = (props) => {
  const {
    awsAccessKeyId,
    awsSecretAccessKey,
    awsRegion,
    errors,
    displayError,
    credentialError,
    handleChange,
    handleFormChange,
    setAWSCredentials,
    displayInfoHandler,
  } = props;

  return (
    <div className="home_page_form_container">
      {/* HOME CONTAINER HEADER */}
      <img className="kre8Logo" src={kre8Logo} alt="" />
      <div className="home_page_form_container_header">
        Build, Deploy and Monitor a Kubernetes Cluster
      </div>
      {/* TEXT JUST BELOW THE HEADER */}
      <div className="home_page_form_container_intro_text">
      Enter your Amazon Web Services account credentials to get started.
      </div>
      {/* HOME INPUT FORM CONTAINER */}
      <div className="home_page_form_container_input_field_area">
        <div className="home_page_form_container_inputs_item">
          <input id="awsAccessKeyId" onChange={handleChange} placeholder="AWS Access Key ID" value={awsAccessKeyId} type="text" name="awsAccessKeyId" maxLength="40" />
          <div className="errorClass">{errors.awsAccessKeyId}</div>
        </div>
        <div className="home_page_form_container_inputs_item">
          <input id="awsSecretAccessKey" onChange={handleChange} placeholder="AWS Secret Access Key" value={awsSecretAccessKey} type="text" maxLength="50" name="awsSecretAccessKey" />
          <div className="errorClass">{errors.awsSecretAccessKey}</div>
        </div>
      </div>
      {/* DROPDOWN + BUTTONS AT THE BOTTOM CONTAINER */}
      <div className="home_page_form_container_buttons">
        <div className="home_page_form_container_buttons_item">
          <select className="dropDown" value={awsRegion} onChange={handleFormChange}>
            <option value="default">Select Region</option>
            <option value="us-west-2">US West (Oregon) (us-west-2)</option>
            <option value="us-east-1">US East (N. Virginia) (us-east-1)</option>
            <option value="us-east-2">US East (Ohio) (us-east-2)</option>
            <option value="eu-central-1">EU (Frankfurt) (eu-central-1)</option>
            <option value="eu-north-1">EU (Stockholm) (eu-north-1)</option>
            <option value="eu-west-1">EU (Ireland) (eu-west-1)</option>
            <option value="eu-west-2">EU (London) (eu-west-2)</option>
            <option value="eu-west-3">EU (Paris) (eu-west-3)</option>
            <option value="ap-northeast-1">Asia Pacific (Tokyo) (ap-northeast-1)</option>
            <option value="ap-northeast-2">Asia Pacific (Seoul) (ap-northeast-2)</option>
            <option value="ap-south-1">Asia Pacific (Mumbai) (ap-south-1)</option>
            <option value="ap-southeast-1">Asia Pacific (Singapore) (ap-southeast-1)</option>
            <option value="ap-southeast-2">Asia Pacific (Sydney) (ap-southeast-2)</option>
          </select>
        </div>
        <div className="home_page_form_container_buttons_item">
          <ActionButton id="home_form_buttom" clickHandler={setAWSCredentials} buttonText="Submit" />
          <div id="home_page_help_info_button">
            <HelpInfoButton clickHandler={displayInfoHandler} />
          </div>
        </div>
      </div>
      <div style={{ alignSelf: 'flex-start', marginLeft: '50px', marginTop: '-8px' }} className="errorClass">{errors.awsRegion}</div>
      {displayError === true
      && (<div className="errorClass" id="home_page_container_error">{credentialError}</div>)
      }
    </div>
  );
};

export default HomeComponent;
