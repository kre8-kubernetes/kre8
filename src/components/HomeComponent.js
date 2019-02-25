import React from "react";
import '../styles.css'
import cloudGIF from '../assets/cloudGIF.gif'


const HomeComponent = props => {
  return (
    <div className='home_container'>
      <img src={cloudGIF} alt='CloudGIF' className='HomeGIF'/>;
      <div className='home_center_container'>
        <div className="section">  
          <h1>Create and Deploy your Kubernetes Cluster to the Cloud</h1>
          <div className='home_input_container'>
            <form>
              <h2>Create an IAM Role</h2>
                <h4>Input AWS Access Key ID</h4>
                <input id='awsAccessKeyId' onChange={props.handleChange} value={props.awsAccessKeyId} type="text" name="awsAccessKeyId" />
                <h4>Input AWS Secret Access Key</h4>
                <input id='awsSecretAccessKey' onChange={props.handleChange} value={props.awsSecretAccessKey} type="text" name="awsSecretAccessKey" />
                <h4>Input AWS Region</h4>
                <input id='awsRegion' onChange={props.handleChange} value={props.awsRegion} type="text" name="awsRegion" />
            </form>
          </div>
          <button onClick={props.setAWSCredentials} className="homebutton">Submit!</button>;
        </div>
      </div>
    </div>
    );
  };
  
  export default HomeComponent;
  