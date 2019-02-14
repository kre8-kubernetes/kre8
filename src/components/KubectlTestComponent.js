import React from 'react';

const KubectlTestComponent = (props) => {

  return (
    <div>
      <button onClick={props.handleCreatePod}>Create a Pod</button>
      <button onClick={props.handleCreateDeployment}>Create a Deployment</button>
      <button onClick={props.handleCreateService}>Create a Service</button>
      <ul>
        <li>{props.podName}</li>
        <li>{props.deploymentName}</li>
        <li>{props.serviceName}</li>
      </ul>
    </div>
  )
}

export default KubectlTestComponent;