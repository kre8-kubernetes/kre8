import React from "react";
import { Link } from 'react-router-dom';
import "../styles.css";


const AWSLoadingComponent = props => {

  return (
    <div className='aws_loading_form_component'>
      <div className='aws_loading_form_component_item'>
        <p>IAM Role {props.iamRoleName}</p>
        <p>Status {props.iamRoleStatus}</p>

        </div>
      
      {/* <div className='aws_cluster_form_container_header' className='aws_loading_component_header'>
        <h3>Cluster Status</h3>
      </div> */}
        {/* <div className='aws_cluster_form_timing_text' className='aws_loading_component_explainer_text'>
          The cluster creation process takes AWS approximately 10-15 minutes. Please do not close the application, until the process is complete.
        </div> */}

        {/* <div className='aws_loading_component_text'> */}
            {/* IAM Role {props.iamRoleName} 
            VPC Stack {props.vpcStackName}
            Cluster {props.clusterName}
            Worker Nodes {`${props.clusterName}-worker-node`} */}
            {/* Kubectl Configuration */}
        {/* </div> */}

        {/* <div className='aws_loading_component_status_text'>  */}
          {/* {props.iamRoleStatus}
          {props.stackStatus}
          {props.clusterStatus}
          {props.workerNodeStatus}
          {props.kubectlConfigStatus} */}
        {/* </div> */}
        {/* <div className='aws_loading_component_error_text'> 
          {props.errorMessage} 
        </div> */}
      
    </div>

  );
};

export default AWSLoadingComponent;
