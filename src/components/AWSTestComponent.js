import React from 'react';
import clouds from '../assets/clouds.jpeg'

import '../styles.css'

const AWSTestComponent = (props) => {

  return (
    <div>
      {/* Background Image for the page, z-indexed */}
      <img src={clouds} alt="Clouds" className="image" />
      {/* IAM Authenticator button */}
      <br />
      <br />
      <button onClick={props.emitInstallAuthenticator}>Install AWS IAM Authenticator</button>
      <br />
      <br />

      {/* Create IAM Role form and Button */}
      <br />
      <br />
      <div className="section">
        <form>
          <h2>Create an IAM Role</h2>
            <h4>Role name:</h4>
              <input id='createRole_roleName' onChange={props.handleChange} value={props.createRole_roleName} type="text" name="createRole_roleName" />
              <br />
            <h4>Role description:</h4>
             <input id='createRole_description' onChange={props.handleChange} value={props.createRole_description} type="text" name="createRole_description" />
              <br />
        </form>
        <br />
        <button className="buttons" onClick={props.handleCreateRole}>Create IAM Role</button>
      </div>
      {/* Create Tech Stack Form */}
      <br />
      <br />
      <div className="section">
        <form>
          <h2>Create a Stack</h2>
            <h4>Stack name:</h4>
              <input id='createTechStack_stackName' onChange={props.handleChange} value={props.createTechStack_stackName} type="text" name="createTechStack_stackName" />
              <br />
        </form>
        <br />
        <button className="buttons" onClick={props.handleCreateTechStack}>Create Tech Stack</button>
      </div>
      {/* Create AWS Cluster */}
      <br />
      <br />
      <div className="section">
        <form>
          <h2>Create a Cluster</h2>
            <h4>Cluster name:</h4>
              <input id='createCluster_clusterName' onChange={props.handleChange} value={props.createCluster_clusterName} type="text" name="createCluster_clusterName" />
              <br />
        </form>
        <br />
        <button className="buttons" onClick={props.handleCreateCluster}>Create Cluster</button>
      </div>

      <br />
      <br />
      <button onClick={props.handleConfigAndMakeNodes}>Configuring Kubectl and Making Worker Nodes</button>
      <br />
      <br />

    </div>   
  )
}

export default AWSTestComponent;