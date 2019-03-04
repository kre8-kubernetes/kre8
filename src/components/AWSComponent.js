import React from "react";
import { Link } from 'react-router-dom';
import "../styles.css";


const AWSComponent = props => {
  return (
    <div className="aws_cluster_form_container">

      <div className='aws_cluster_form_container_header'>
        <h2>Setup Cluster to AWS</h2>
      </div>
      <div className='aws_cluster_form_container_input'>
        <input id="iamRoleName" placeholder='IAM Role Name' onChange={props.handleChange} value={props.iamRoleName} type="text"/>
        {props.validator.message('Role name', props.iamRoleName, 'required')}
        <h6>Role name can contain alphanumeric and '+=,.@-_' characters. Maximum 64 characters.</h6>
      </div>

      <div className='aws_cluster_form_container_input'>
        <input id="vpcStackName" placeholder='VPC Stack Name' onChange={props.handleChange} value={props.vpcStackName} type="text"/>
        {props.validator.message('Stack name', props.vpcStackName, 'required')}
        <h6>Stack name can contain only alphanumeric characters and dashes '-'. Maximum 128 characters.</h6>
      </div>

      <div className='aws_cluster_form_container_input'>
        <input id="clusterName" placeholder='Cluster Name' onChange={props.handleChange} value={props.clusterName} type="text"/>
        {props.validator.message('Cluster name', props.clusterName, 'required')}
        <h6>Cluster name can contain only alphanumeric characters, dashes '-' and underscores '_'. Maximum 100 characters.</h6>
      </div>

      <div className='aws_cluster_form_container_button'>
        <button onClick={props.handleConfigAndMakeNodes} className='buttons'>Submit</button>
      </div>
      
    </div>
  );
};

export default AWSComponent;
