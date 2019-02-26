import React from "react";
// import clouds from '../assets/clouds.jpeg'
import cloudGIF from "../assets/cloudGIF.gif";

import "../styles.css";

const AWSTestComponent = props => {
  return (
    <div className="aws_cluster_page_item">
      {/* <img src={cloudGIF} alt="CloudGIF" className="HomeGIF" /> */}
      

      
      <div className="aws_cluster_form_container">
        
        {/* IAM Authenticator button */}
        <button onClick={props.emitInstallAuthenticator}>
          Install AWS IAM Authenticator
        </button>
        <br />

        {/* Create IAM Role form and Button */}
        <div className="aws_cluster_form_item">
          <form>
            <h3>Create an IAM Role</h3>
            <h4>Role name:</h4>
            <input
              id="createRole_roleName"
              onChange={props.handleChange}
              value={props.createRole_roleName}
              type="text"
              name="createRole_roleName"
            />
            <br />
            <h4>Role description:</h4>
            <input
              id="createRole_description"
              onChange={props.handleChange}
              value={props.createRole_description}
              type="text"
              name="createRole_description"
            />
            <br />
          </form>
          <br />
          {/* <button className="buttons" onClick={props.handleCreateRole}>
            Create IAM Role
          </button> */}
        </div>
        
        {/* Create Tech Stack Form */}
        <div className="aws_cluster_form_item">
          <form>
            <h3>Create a Stack</h3>
            <h4>Stack name:</h4>
            <input
              id="createTechStack_stackName"
              onChange={props.handleChange}
              value={props.createTechStack_stackName}
              type="text"
              name="createTechStack_stackName"
            />
            <br />
          </form>
          <br />
          {/* <button className="buttons" onClick={props.handleCreateTechStack}>
            Create Tech Stack
          </button> */}
        </div>
        
        {/* Create AWS Cluster */}
        <div className="aws_cluster_form_item">
          {/* <div className="section"> */}
          <form>
            <h3>Create a Cluster</h3>
            <h4>Cluster name:</h4>
            <input
              id="createCluster_clusterName"
              onChange={props.handleChange}
              value={props.createCluster_clusterName}
              type="text"
              name="createCluster_clusterName"
            />
            <br />
          </form>
          <br />
          {/* <button className="buttons" onClick={props.handleCreateCluster}>
            Create Cluster
          </button> */}
        </div>

        <br></br>
        <button onClick={props.handleConfigAndMakeNodes}>
          Do all the things AND Configure Kubectl AND Make Worker Nodes
        </button>
      </div>

    </div>
  );
};

export default AWSTestComponent;
