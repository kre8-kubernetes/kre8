import React from 'react';

const AWSTestComponent = (props) => {

  return (
    <div>
      <button onClick={props.handleCreateRole}>Create a ROLE</button>
      <ul>
        <li>{props.roleName}</li>
      </ul>
    </div>   
  )
}

export default AWSTestComponent;