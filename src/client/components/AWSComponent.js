import React from 'react';
import ActionButton from './Buttons/ActionButton';
import HelpInfoButton from './Buttons/HelpInfoButton';


/** ------------ AWS COMPONENT ------------------------------
  ** Rendered by the AWSContainer
  * On user's initial encounter with the application, component is rendered,
  * features a form requesting the user input names for their
  * IAM Role, VPC Stack and Cluster.
  * User can navigate back to the screen via Nav bar to enter new credentials
*/

const AWSComponent = (props) => {
  const {
    handleChange,
    handleConfigAndMakeNodes,
    displayInfoHandler,
    iamRoleName,
    vpcStackName,
    clusterName,
    errors,
    aws,
  } = props;

  return (
    <div className="aws_cluster_form_container">
      {/* AWS CONTAINER HEADER */}
      <div className="aws_cluster_form_container_header">
        Build your Kubernetes Cluster
      </div>
      {/* TEXT JUST BELOW THE HEADER */}
      <div className="aws_cluster_form_intro_text">
        Please input the details below to create your cluster. Once submitted, this phase takes AWS 10-15 minutes to complete.
      </div>
      {/* AWS INPUT FORM CONTAINER */}
      <div className="aws_cluster_form_input_field_area">
        <div className="aws_cluster_form_container_inputs_item">
          <input id="iamRoleName" placeholder="IAM Role Name" onChange={handleChange} value={iamRoleName} type="text" />
          {(!errors.iamRoleName)
            ? (<div className="aws_cluster_form_container_explainer_text">*64 character max, including alphanumeric characters and &quot;+=,.@-_&quot;.</div>)
            : (<div className="errorClass">{errors.iamRoleName}</div>)
          }
        </div>
        <div className="aws_cluster_form_container_inputs_item">
          <input id="vpcStackName" placeholder="VPC Stack Name" onChange={handleChange} value={vpcStackName} type="text" />
          {(!errors.vpcStackName)
            ? (<div className="aws_cluster_form_container_explainer_text">*128 character max, including alphanumeric characters and dashes &quot;-&quot;.</div>)
            : (<div className="errorClass">{errors.vpcStackName}</div>)
          }
        </div>
        <div className="aws_cluster_form_container_inputs_item">
          <input id="clusterName" placeholder="Cluster Name" onChange={handleChange} value={clusterName} type="text" />
          {(!errors.clusterName)
            ? (<div className="aws_cluster_form_container_explainer_text">*100 character max, including alphanumeric characters, dashes &quot;-&quot; and underscores &quot;_&quot;.</div>)
            : (<div className="errorClass">{errors.clusterName}</div>)
          }
        </div>
      </div>
      <div className="aws_cluster_form_container_button_item">
        <ActionButton id="aws_form_button" clickHandler={handleConfigAndMakeNodes} buttonText="Submit" />
        <div id="aws_form_more_info_button">
          <HelpInfoButton clickHandler={displayInfoHandler} aws={aws} />
        </div>
      </div>
    </div>
  );
};

export default AWSComponent;
