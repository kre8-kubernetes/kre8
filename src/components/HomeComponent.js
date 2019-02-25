import React from "react";
import '../styles.css'
import cloudGIF from '../assets/cloudGIF.gif'


const HomeComponent = props => {
  return (
    <div className='home_container'>
      <img src={cloudGIF} alt='CloudGIF' className='HomeGIF'/>;
      <div className='home_center_container'>
        <h1>Create and Deploy your Kubernetes Cluster to the Cloud</h1>
        <div className='home_input_container'>
          <input id='aws_access_key_id' onChange={props.handleChange} value={props.aws_access_key_id} type="text" name="aws_access_key_id" />
          <input id='aws_secret_access_key_id' onChange={props.handleChange} value={props.aws_secret_access_key_id} type="text" name="aws_secret_access_key_id" />
        </div>
      </div>
      <button onClick={props.handleSubmit} className="homebutton">KRE8</button>;
    </div>
    );
  };
  
  export default HomeComponent;
  