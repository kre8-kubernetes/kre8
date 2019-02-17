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
          Role Name:
        <br />
          <input id='createRole_roleName' onChange={props.handleChange} value={props.createRole_roleName} type="text" name="createRole_roleName" />
          <br />
          Description:
        <br />
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
          Stack Name:
        <br />
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
          Cluster Name:
        <br />
          <input id='createCluster_clusterName' onChange={props.handleChange} value={props.createCluster_clusterName} type="text" name="createCluster_clusterName" />
          <br />
        </form>
        <br />
        <button className="buttons" onClick={props.handleCreateCluster}>Create Cluster</button>
      </div>
    </div>   
  )
}

export default AWSTestComponent;