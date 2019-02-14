import React from "react";
import '../styles.css'
import cloudGIF from '../assets/cloudGIF.gif'


const HomeComponent = props => {
  return (
    <div>
        <h1 className="header">Create and Deploy your Kubernetes Cluster to the Cloud</h1>
        <button onClick={props.handleChangeScreen} className="homebutton">KRE8</button>;
        <img src={cloudGIF} alt="CloudGIF" className="HomeGIF"/>;
    </div>

    );
  };
  
  export default HomeComponent;
  