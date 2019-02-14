import React from 'react';

const AWSTestComponent = (props) => {

  return (
    <div>
      <button onClick={props.handleCreateRole}>Create a ROLE</button>
      <button onClick={props.emitInstallAuthenticator}>Install AWS IAM Authenticator</button>

      <ul>
        <li>{props.roleName}</li>
      </ul>
    </div>   
  )
}

export default AWSTestComponent;