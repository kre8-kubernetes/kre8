import React from 'react';

const KubectlTestComponent = (props) => {

  return (
    <div>
      <button onClick={props.handleCreatePod}>Create a POD</button>
      <ul>
        <li>{props.podName}</li>
      </ul>
    </div>
  )
}

export default KubectlTestComponent;