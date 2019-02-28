import React from "react";
import { Link } from 'react-router-dom';
import "../styles.css";


const AWSComponent = props => {
  return (
    <div className="aws_cluster_page_item">
    
      <div className="aws_cluster_container">
        
        {/* IAM Authenticator button */}
        <button onClick={props.emitInstallAuthenticator} className='buttons'>
          Install AWS IAM Authenticator
        </button>
        <br />

        <div className='aws_cluster_form_container'>
        
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
            {props.validator.message('Role name', props.createRole_roleName, 'required')}

            <h5>Role name can contain alphanumeric and '+=,.@-_' characters. Maximum 64 characters.</h5>
            {/* <br />
            <h4>Role description:</h4>
            <input
              id="createRole_description"
              onChange={props.handleChange}
              value={props.createRole_description}
              type="text"
              name="createRole_description"
            />
            <br /> */}
          </form>
          <br />
          <button className="buttons" onClick={props.handleCreateRole}>
            Create IAM Role
          </button>
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
            {props.validator.message('Stack name', props.createTechStack_stackName, 'required')}

            <h5>Stack name can contain only alphanumeric characters and dashes '-'. Maximum 128 characters.</h5>
            <br />
          </form>
          <br />
          <button className="buttons" onClick={props.handleCreateTechStack}>
            Create Tech Stack
          </button>
        </div>
        
        {/* Create AWS Cluster */}
        <div className="aws_cluster_form_item">
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
            {props.validator.message('Cluster name', props.createCluster_clusterName, 'required')}
            <h5>Cluster name can contain only alphanumeric characters, dashes '-' and underscores '_'. Maximum 100 characters.</h5>            
            <br />
          </form>
          <br />
          <button className="buttons" onClick={props.handleCreateCluster}>
            Create Cluster
          </button>
        </div>
        </div>

        <br></br>
        <button onClick={props.handleConfigAndMakeNodes} className='buttons'>
          Do all the things AND Configure Kubectl AND Make Worker Nodes
        </button>
        <Link to="/cluster">KUBECTL</Link>
      </div>

    </div>
  );
};

export default AWSComponent;
