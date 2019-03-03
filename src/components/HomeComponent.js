import React from "react";
import '../styles.css'
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';


const HomeComponent = props => {
  return (
      <div className='home_page_form_container'>
        {/* CENTER CONTAINER HEADER */}
        <div className='home_page_form_container_header'>
          <h3>Create and Deploy your Kubernetes Cluster</h3>
        </div>
        {/* TEXT JUST BELOW THE HEADER */}
        <div className='home_page_form_container_text'>
        <p>Creating and launching your Kubernetes cluster to the Amazon cloud can be a long and complicated process. Kre8 is here to simplify everything for you. Let’s get started!</p>
        </div>
        {/* INPUT FORM CONTAINER */}
        <div className='home_page_form_container_inputs'>
          <div className='home_page_form_container_inputs_item'>
            <input id='awsAccessKeyId' onChange={props.handleChange} placeholder='AWS Access Key ID' value={props.awsAccessKeyId} type="text" name="awsAccessKeyId" />
            {props.validator.message('Access Key id', props.awsAccessKeyId, 'required|min:15|max:40')}
          </div>
          <div className='home_page_form_container_inputs_item'>
          <input id='awsSecretAccessKey' onChange={props.handleChange} placeholder='Secret Access Key' value={props.awsSecretAccessKey} type="text" name="awsSecretAccessKey" />
            {props.validator.message('Secret Access Key', props.awsSecretAccessKey, 'required|min:30|max:50')}
          </div>

        </div>
        {/* BUTTONS AT THE BOTTOM CONTAINER */}
        <div className='home_page_form_container_buttons'>
          <div className='home_page_form_container_buttons_item'>
            <select className="dropDown" placeholder='REGION' value={props.awsRegion} onChange={props.handleFormChange}>
              <option selected='selected' value='REGION'>Select Region</option>
              <option value='US West (Oregon) (us-west-2)'>US West (Oregon) (us-west-2)</option>
              <option value='US East (N. Virginia) (us-east-1)'>US East (N. Virginia) (us-east-1)</option>
              <option value='US East (Ohio) (us-east-2)'>US East (Ohio) (us-east-2)</option>
              <option value='EU (Frankfurt) (eu-central-1)'>EU (Frankfurt) (eu-central-1)</option>
              <option value='EU (Stockholm) (eu-north-1)'>EU (Stockholm) (eu-north-1)</option>
              <option value='EU (Ireland) (eu-west-1)'>EU (Ireland) (eu-west-1)</option>
              <option value='EU (London) (eu-west-2)'>EU (London) (eu-west-2)</option>
              <option value='EU (Paris) (eu-west-3)'>EU (Paris) (eu-west-3)</option>
              <option value='Asia Pacific (Tokyo) (ap-northeast-1)'>Asia Pacific (Tokyo) (ap-northeast-1)</option>
              <option value='Asia Pacific (Seoul) (ap-northeast-2)'>Asia Pacific (Seoul) (ap-northeast-2)</option>
              <option value='Asia Pacific (Mumbai) (ap-south-1)'>Asia Pacific (Mumbai) (ap-south-1)</option>
              <option value='Asia Pacific (Singapore) (ap-southeast-1)'>Asia Pacific (Singapore) (ap-southeast-1)</option>
              <option value='Asia Pacific (Sydney) (ap-southeast-2)'>Asia Pacific (Sydney) (ap-southeast-2)</option>
            </select>
          </div>
          <div className='home_page_form_container_buttons_item'>
            <button id='home_submit_button' onClick={props.setAWSCredentials}>Submit</button>
            <button id='home_info' onClick={props.displayInfoHandler}>
              {/* TODO: remove FontAwesome if we dont need it!!! */}
              {/* <FontAwesomeIcon icon="question-circle" id="home_info" styles={props.mouseCoords}/> */}
              ?
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default HomeComponent;
  