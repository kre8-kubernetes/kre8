import React from 'react';

const ClusterInfoComponent = (props) => {

  return (
    <div className='cluster_info_container'>
      <div className='cluster_info_container_item'>
        <div className="cluster_info_major"> Cluster: {props.clusterInfo.clusterName}</div>
        <div className="cluster_info_minor"> Cluster Arn: {props.clusterInfo.clusterArn}</div>
        <div className="cluster_info_major"> IAM Role: {props.clusterInfo.iamRoleName}</div>
        <div className="cluster_info_minor"> IAM Role Arn: {props.clusterInfo.iamRoleArn}</div>
        <div className="cluster_info_major"> Stack: {props.clusterInfo.stackName}</div>
        <div className="cluster_info_minor"> VPC ID: {props.clusterInfo.vpcId}</div>
        <div className="cluster_info_minor"> Security Group Id: {props.clusterInfo.securityGroupIds}</div>
        <div className="cluster_info_minor"> Subnet Ids: {props.clusterInfo.subnetIdsArray[0]}, {props.clusterInfo.subnetIdsArray[1]}, {props.clusterInfo.subnetIdsArray[2]}</div>
        <div className="cluster_info_minor"> Server End Point: {props.clusterInfo.serverEndPoint}</div>
        <div className="cluster_info_minor"> Key Name: {props.clusterInfo.KeyName}</div>
        <div className="cluster_info_minor"> Worker Node Stack Name: {props.clusterInfo.workerNodeStackName}</div>
        <div className="cluster_info_minor"> Worker Node Role Arn: {props.clusterInfo.nodeInstanceRoleArn}</div>
      </div>
    </div>
  );
}

export default ClusterInfoComponent;