import React, { Component } from 'react';
import CloseButton from '../components/Buttons/CloseButton';

// When user clicks the (?) button, display this modal
const HelpInfoComponent = (props) => {
  const {
    aws,
    textInfo,
    hideInfoHandler,
  } = props;

  return (
    aws === true
      ? (
        <div id="aws_more_info_component" className="more_info_component">
          <div id="aws_more_info_component_button">
            <CloseButton clickHandler={hideInfoHandler} />
          </div>
          {/* {textInfo} */}
          <div id="aws_more_info_component_title" className="more_info_component_title">Amazon Web Services EKS Setup</div>
          <div id="aws_more_info_component_explainer_text" className="more_info_component_explainer_text">
            Hosting a cluster on AWS Elastic Container Service for Kubernetes (EKS), requires the activation of several services.
          </div>
          <div id="aws_more_info_component_IAM_role">
            <div id="aws_more_info_component_IAM_role_subhead" className="more_info_subhead">IAM Role</div>
            <div id="aws_more_info_component_IAM_role_text" className="more_info_paragraph">Your Identity and Access Management (IAM) Role for EKS is the AWS identity that has specific permissions to manage your cluster.</div>
          </div>
          <div id="aws_more_info_component_VPC_stack">
            <div id="aws_more_info_component_VPC_stack_subhead" className="more_info_subhead">VPC Stack</div>
            <div id="aws_more_info_component_VPC_stack_text" className="more_info_paragraph">Your AWS VPC Stack represents a collection of resources necessary to manage and run a Kubernetes cluster.</div>
          </div>
          <div id="aws_more_info_component_cluster">
            <div id="aws_more_info_component_cluster_subhead" className="more_info_subhead">EKS Cluster</div>
            <div id="aws_more_info_component_cluster_text" className="more_info_paragraph">An EKS Cluster consists of two primary components: The EKS Control Plane and Amazon EKS Worker Nodes that run the Kubernetes etcd and the Kubernetes API Server.</div>
          </div>
          <div id="aws_more_info_component_explainer_text_ital" className="more_info_component_explainer_text_ital">
          <i>Creating these services takes AWS approximately 15 minutes. Please keep the application open for the duration of the process.</i>
          </div>
         
          {/* <button id="more_info_component_close_button" className="aws_more_info_component_button" onClick={hideInfoHandler} type="button">{CloseButton}</button> */}
        </div>
      )
      : (
        <div id="home_more_info_component" className="more_info_component">
          <div id="home_more_info_component_button">
            <CloseButton clickHandler={hideInfoHandler} />
          </div>
          <div id="home_more_info_component_title" className="more_info_component_title">Amazon Web Services Account Details</div>
          <div 
            id="home_more_info_component_explainer_text_1" 
            className="more_info_component_explainer_text">
              KRE8 needs your Amazon Web Services Access Key and Secret Key in order to interact with your AWS account.
            </div>
            <div id="home_more_info_component_explainer_text_2" className="more_info_component_explainer_text">To locate your AWS account credentials:</div>
            <ul id="home_more_info_component_list">
              <li className="home_more_info_component_list_item">Log into your&nbsp;<a href="https://aws.amazon.com">AWS Account</a></li>
              <li className="home_more_info_component_list_item">Click your username at the top right of the page.</li>
              <li className="home_more_info_component_list_item">Click “My Security Credentials” link from the drop-down menu.</li>
              <li className="home_more_info_component_list_item">Navigate to the AWS IAM credentials section.</li>
              <li className="home_more_info_component_list_item">Copy the Access Key ID and Secret Access Key.</li>
            </ul>
            <div id="home_more_info_component_explainer_text_3" className="more_info_component_explainer_text">Don’t have an AWS account? Visit&nbsp;<a href="https://aws.amazon.com">Amazon Web Services</a>&nbsp;to create one.</div>
        </div>
      )
  );
};

export default HelpInfoComponent;
