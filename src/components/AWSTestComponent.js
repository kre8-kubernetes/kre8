import React from 'react';

const AWSTestComponent = (props) => {

  return (
    <div>
      <button onClick={props.emitInstallAuthenticator}>Install AWS IAM Authenticator</button>
      <button onClick={props.handleCreateRole}>Create IAM Role</button>
      <button onClick={props.handleCreateTechStack}>Create Tech Stack</button>

      <ul>
        <li>{props.roleName}</li>
      </ul>
    </div>   
  )
}

export default AWSTestComponent;