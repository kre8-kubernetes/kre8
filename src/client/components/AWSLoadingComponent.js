import React from "react";

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
          <p>{iamRoleStatus}</p>
        </div>
        <div className="aws_loading_form_component_item">
          <p>VPC Stack {vpcStackName}</p>
          <p>{stackStatus}</p>
        </div>
        <div className="aws_loading_form_component_item">
          <p>Cluster {clusterName}</p>
          <p>{clusterStatus}</p>
        </div>
        <div className="aws_loading_form_component_item">
          <p>Worker Node Stack</p>
          <p>{workerNodeStatus}</p>
        </div>
        <div className="aws_loading_form_component_item">
          <p>Kubectl Configuration</p>
          <p>{kubectlConfigStatus}</p>
        </div>
      </div>
      <div className="aws_loading_component_error_text">
        <p>{errorMessage}</p>
      </div>
    </div>
  );
};

export default AWSLoadingComponent;
