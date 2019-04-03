/* eslint-disable arrow-parens */
import React from "react";
import ActionButton from './Buttons/ActionButton';
import HelpInfoButton from './Buttons/HelpInfoButton';

const AWSComponent = props => {
  const {
    handleChange,
    handleConfigAndMakeNodes,
    displayInfoHandler,
    iamRoleName,
    vpcStackName,
    clusterName,
    errors,
  } = props;

  return (
    <div className="aws_cluster_form_container">
      {/* AWS CONTAINER HEADER */}
      <div className="aws_cluster_form_container_header">
        Build your Kubernetes Cluster
      </div>
      {/* TEXT JUST BELOW THE HEADER */}
      <div className="aws_cluster_form_intro_text">
        <p>Please input the details below to create your cluster. Once submitted, this phase takes AWS 10-15 minutes to complete.</p>
      </div>
      {/* AWS INPUT FORM CONTAINER */}
      <div className="aws_cluster_form_input_field_area">
        <div className="aws_cluster_form_container_inputs_item">
          <input id="iamRoleName" placeholder="IAM Role Name" onChange={handleChange} value={iamRoleName} type="text" />
          <div className="aws_cluster_form_container_explainer_text">*64 character max, including alphanumeric characters and &quot;+=,.@-_&quot;.</div>
          <div className="errorClass">{errors.iamRoleName}</div>
        </div>
        <div className="aws_cluster_form_container_inputs_item">
          <input id="vpcStackName" placeholder="VPC Stack Name" onChange={handleChange} value={vpcStackName} type="text" />
          <div className="aws_cluster_form_container_explainer_text">*128 character max, including alphanumeric characters and dashes &quot;-&quot;.</div>
          <div className="errorClass">{errors.vpcStackName}</div>
        </div>

        <div className="aws_cluster_form_container_inputs_item">
          <input id="clusterName" placeholder="Cluster Name" onChange={handleChange} value={clusterName} type="text" />
          <div className="aws_cluster_form_container_explainer_text">*100 character max, including alphanumeric characters, dashes &quot;-&quot; and underscores &quot;_&quot;.</div>
          <div className="errorClass">{errors.clusterName}</div>
        </div>
      </div>
      <div className="aws_cluster_form_container_button_item">
        <ActionButton id="aws_form_button" clickHandler={handleConfigAndMakeNodes} buttonText="Submit" />
        <HelpInfoButton clickHandler={displayInfoHandler} />
      </div>

    </div>
  );
};

export default AWSComponent;
