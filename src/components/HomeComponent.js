import React from "react";
import '../styles.css'
import cloudGIF from '../assets/cloudGIF.gif'


const HomeComponent = props => {
  return (
    <div className='home_page_item'>
      {/* <img src={cloudGIF} alt='CloudGIF' className='HomeGIF'/>; */}
      
      <div className='home_page_form_container'>
        {/* <div className="section"> */}
        <h1>Kre8</h1>
          <h2>Create and Deploy your Kubernetes Cluster to the Cloud</h2>
          <p>Creating and launching your Kubernetes cluster to the Amazon cloud can be a long and complicated process. 
            Kre8 is here to simplify everything for you. Let's get started!</p>
            <form>
                <h4>AWS Access Key ID</h4>
                <input id='awsAccessKeyId' onChange={props.handleChange} value={props.awsAccessKeyId} type="text" name="awsAccessKeyId" />
                <h5>TODO ADD Data requirements here</h5>
                {props.validator.message('Access Key id', props.awsAccessKeyId, 'required')}

                <h4>AWS Secret Access Key</h4>
                <input id='awsSecretAccessKey' onChange={props.handleChange} value={props.awsSecretAccessKey} type="text" name="awsSecretAccessKey" />
                <h5>TODO ADD Data requirements here</h5>
                {props.validator.message('Secret Access Key', props.awsSecretAccessKey, 'required')}

                <h4>Select AWS Region</h4>
                <input id='awsRegion' onChange={props.handleChange} value={props.awsRegion} type="text" name="awsRegion" />
                {props.validator.message('Region', props.awsRegion, 'required')}

                <button onClick={props.setAWSCredentials} className="homebutton">Submit!</button>
            </form>
            <br></br>
            <button onClick={props.setAWSCredentials} className="buttons">Submit</button>
        </div>

    </div>
    );
  };
  
  export default HomeComponent;
  