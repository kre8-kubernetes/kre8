import React from "react";
import { Link } from 'react-router-dom';
import "../styles.css";


const AWSComponent = props => {
  return (
    <div className="aws_cluster_form_container">

      <div className='aws_cluster_form_container_header'>
        <h3>Configure your Kubernetes Cluster</h3>
      </div>
      <div className='aws_cluster_form_timing_text'>
        Please input the below details to create your cluster. Once submitted, this phase takes AWS 10-15 minutes.
      </div>

      <div className='aws_cluster_form_input_field_area'>
        <div className='aws_cluster_form_container_input'>
          <input id="iamRoleName" placeholder='IAM Role Name' onChange={props.handleChange} value={props.iamRoleName} type="text"/>
          {props.validator.message('Role name', props.iamRoleName, 'required')}
          <div className='aws_cluster_form_container_explainer_text'>64 character max, alphanumeric chars and '+=,.@-_'.</div>
        </div>

        <div className='aws_cluster_form_container_input'>
          <input id="vpcStackName" placeholder='VPC Stack Name' onChange={props.handleChange} value={props.vpcStackName} type="text"/>
          {props.validator.message('Stack name', props.vpcStackName, 'required')}
          <div className='aws_cluster_form_container_explainer_text'>*128 character max, alphanumeric chars and dashes '-'.</div>
        </div>

        <div className='aws_cluster_form_container_input'>
          <input id="clusterName" placeholder='Cluster Name' onChange={props.handleChange} value={props.clusterName} type="text"/>
          {props.validator.message('Cluster name', props.clusterName, 'required')}
          <div className='aws_cluster_form_container_explainer_text'>100 character max, alphanumeric chars, dashes '-' and underscores '_'.</div>
        </div>

        <div className='aws_cluster_form_container_button'>
          <button onClick={props.handleConfigAndMakeNodes} className='buttons'>Submit</button>
        </div>
      </div>  

      <div className='aws_cluster_form_container_button_item'>
        <button id="aws_submit_button" onClick={props.handleConfigAndMakeNodes} className='buttons'>Submit</button>
        <button id='aws_info' onClick={props.displayInfoHandler}>?</button>
        </div>

      
    </div>
  );
};

export default AWSComponent;
