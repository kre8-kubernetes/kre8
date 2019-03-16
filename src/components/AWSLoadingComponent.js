import React from "react";
import { Link } from 'react-router-dom';
// import "../styles.css";


const AWSLoadingComponent = props => {

  return (
    <div className='aws_loading_form_component'>
      <div className='aws_loading_form_component_header'>
        <h3>Cluster Status</h3>
      </div>

      <div className='aws_loading_component_explainer_text'>
        Cluster configuration takes AWS approximately 10-15 minutes. Do not close the application, until the process completes.
      </div>

      <div className='aws_loading_form_component_items'>

        <div className='aws_loading_form_component_item'>
          <p>IAM Role {props.iamRoleName}</p>
          <p>{props.iamRoleStatus}</p>
        </div>
        <div className='aws_loading_form_component_item'>
          <p>VPC Stack {props.vpcStackName}</p>
          <p>{props.stackStatus}</p>
        </div>
        <div className='aws_loading_form_component_item'>
          <p>Cluster {props.clusterName}</p>
          <p>{props.clusterStatus}</p>
        </div>
        <div className='aws_loading_form_component_item'>
          <p>Worker Node Stack</p>
          <p>{props.workerNodeStatus}</p>
        </div>
        <div className='aws_loading_form_component_item'>
          <p>Kubectl Configuration</p>
          <p>{props.kubectlConfigStatus}</p>
        </div>
      </div>
        
        <div className='aws_loading_component_error_text'> 
          {props.errorMessage} 
        </div>
      
     </div>

  );
};

export default AWSLoadingComponent;
