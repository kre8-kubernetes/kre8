import React from 'react';

/** ------------ AWS LOADING COMPONENT ------------------------------
  ** Rendered by the AWSContainer
  * Appears after user enters credentials in AWSComponent,
  * displays status update for user as their IAM Role, VPC Stack, Cluster and Worker Nodes are created
  * and Kubectl is configured. Takes approximately 15 minutes.
*/

const AWSLoadingComponent = (props) => {
  const {
    iamRoleName,
    iamRoleStatus,
    vpcStackName,
    stackStatus,
    clusterName,
    clusterStatus,
    workerNodeStatus,
    kubectlConfigStatus,
    errorMessage,
  } = props;

  const yellow = '#F3D435';
  const lightBlue = '#DBE9F1';
  const red = 'red';

  let iamTextColor;
  if (iamRoleStatus === 'CREATING') {
    iamTextColor = yellow;
  } else if (iamRoleStatus === 'CREATED') {
    iamTextColor = lightBlue;
  } else if (iamRoleStatus === 'ERROR') {
    iamTextColor = red;
  } else {
    iamTextColor = lightBlue;
  }

  let stackTextColor;
  if (stackStatus === 'CREATING') {
    stackTextColor = yellow;
  } else if (stackStatus === 'CREATED') {
    stackTextColor = lightBlue;
  } else if (stackStatus === 'ERROR') {
    stackTextColor = red;
  } else {
    stackTextColor = lightBlue;
  }

  let clusterTextColor;
  if (clusterStatus === 'CREATING') {
    clusterTextColor = yellow;
  } else if (clusterStatus === 'CREATED') {
    clusterTextColor = lightBlue;
  } else if (clusterStatus === 'ERROR') {
    clusterTextColor = red;
  } else {
    clusterTextColor = lightBlue;
  }

  let workerNodeTextColor;
  if (workerNodeStatus === 'CREATING') {
    workerNodeTextColor = yellow;
  } else if (workerNodeStatus === 'CREATED') {
    workerNodeTextColor = lightBlue;
  } else if (workerNodeStatus === 'ERROR') {
    workerNodeTextColor = red;
  } else {
    workerNodeTextColor = lightBlue;
  }

  let kubectlConfigTextColor;
  if (kubectlConfigStatus === 'CREATING') {
    kubectlConfigTextColor = yellow;
  } else if (kubectlConfigStatus === 'CREATED') {
    kubectlConfigTextColor = lightBlue;
  } else if (kubectlConfigStatus === 'ERROR') {
    kubectlConfigTextColor = red;
  } else {
    kubectlConfigTextColor = lightBlue;
  }

  return (
    <div className="aws_loading_form_component">
      <div className="aws_loading_form_component_header">
        Cluster Status
      </div>
      <div className="aws_loading_component_explainer_text">
        Cluster configuration takes AWS approximately 10-15 minutes. Do not close the application, until the process completes.
      </div>
      <div className="aws_loading_form_component_items">
        <div className="aws_loading_form_component_item">
          <p>IAM Role {iamRoleName}</p>
          <div style={{ color: iamTextColor }}>
            <p>{iamRoleStatus}</p>
          </div>
        </div>
        <div className="aws_loading_form_component_item">
          <p>VPC Stack {vpcStackName}</p>
          <div style={{ color: stackTextColor }}>
            <p>{stackStatus}</p>
          </div>
        </div>
        <div className="aws_loading_form_component_item">
          <p>Cluster {clusterName}</p>
          <div style={{ color: clusterTextColor }}>
            <p>{clusterStatus}</p>
          </div>
        </div>
        <div className="aws_loading_form_component_item">
          <p>Worker Node Stack</p>
          <div style={{ color: workerNodeTextColor }}>
            <p>{workerNodeStatus}</p>
          </div>
        </div>
        <div className="aws_loading_form_component_item">
          <p>Kubectl Configuration</p>
          <div style={{ color: kubectlConfigTextColor }}>
            <p>{kubectlConfigStatus}</p>
          </div>
        </div>
      </div>
      <div className="aws_loading_component_error_text">
        <p>{errorMessage}</p>
      </div>
    </div>
  );
};

export default AWSLoadingComponent;
