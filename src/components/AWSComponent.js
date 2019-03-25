import React from "react";
import ActionButton from './Buttons/ActionButton'
import HelpInfoButton from './Buttons/HelpInfoButton'

// import { Link } from 'react-router-dom';
// import "../styles.css";


const AWSComponent = props => {

  const {
    iamRoleName,
    vpcStackName,
    clusterName,

    errors,
  } = props;

  console.log("errors: ", errors);
  console.log("props", props);


  return (
    <div className="aws_cluster_form_container">
      {/* AWS CONTAINER HEADER */}
      <div className='aws_cluster_form_container_header'>
        <h3>Configure your Kubernetes Cluster</h3>
      </div>

       {/* TEXT JUST BELOW THE HEADER */}
      <div className='aws_cluster_form_timing_text'>
        Please input the below details to create your cluster. Once submitted, this phase takes AWS 10-15 minutes.
      </div>

      {/* AWS INPUT FORM CONTAINER */}
      <div className='aws_cluster_form_input_field_area'>
        <div className='aws_cluster_form_container_input'>
          <input id="iamRoleName" placeholder='IAM Role Name' onChange={props.handleChange} value={iamRoleName} type="text"/>
          <div className='aws_cluster_form_container_explainer_text'>64 character max, alphanumeric chars and '+=,.@-_'.</div>
        <div className='errorClass'>{errors.iamRoleName}</div>
      </div>

        <div className='aws_cluster_form_container_input'>
          <input id="vpcStackName" placeholder='VPC Stack Name' onChange={props.handleChange} value={vpcStackName} type="text"/>
          <div className='aws_cluster_form_container_explainer_text'>*128 character max, alphanumeric chars and dashes '-'.</div>
          <div className='errorClass'>{errors.vpcStackName}</div>
        </div>

        <div className='aws_cluster_form_container_input'>
          <input id="clusterName" placeholder='Cluster Name' onChange={props.handleChange} value={clusterName} type="text"/>
          <div className='aws_cluster_form_container_explainer_text'>100 character max, alphanumeric chars, dashes '-' and underscores '_'.</div>
          <div className='errorClass'>{errors.clusterName}</div>
        </div>

      </div>  

      <div className='aws_cluster_form_container_button_item'>
        <ActionButton clickHandler={props.handleConfigAndMakeNodes} buttonText={`Submit`} />
        <HelpInfoButton clickHandler={props.displayInfoHandler} />
      </div>

    </div>
  );
};

export default AWSComponent;
