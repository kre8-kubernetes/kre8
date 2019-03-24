import React from 'react';

const ClusterInfoComponent = (props) => {

  return (
    <div className='cluster_info_container'>
      <div className='cluster_info_container_item'>

        <div className='cluster_info_major'>
          <span className='cluster_info_key'>Cluster: </span>{props.clusterInfo.clusterName}
        </div>
        <div className='cluster_info_key'> 
          <span className='cluster_info_key'>Cluster Arn: </span>{props.clusterInfo.clusterArn}
        </div>
        <br></br>

        <div className='cluster_info_major'> 
          <span className='cluster_info_key'>IAM Role: </span>{props.clusterInfo.iamRoleName}
        </div>
        <div className='cluster_info_minor'>
          <span className='cluster_info_key'>IAM Role Arn: </span>{props.clusterInfo.iamRoleArn}
        </div>
        <br></br>

        <div className='cluster_info_major'> 
          <span className='cluster_info_key'> Stack Name: </span>{props.clusterInfo.stackName}</div>
        <div className='cluster_info_minor'> 
        <span className='cluster_info_key'>VPC ID: </span>{props.clusterInfo.vpcId}
        </div>
        <div className='cluster_info_minor'> 
        <span className='cluster_info_key'>Security Group Id: </span>
          {props.clusterInfo.securityGroupIds}</div>
        <div className='cluster_info_minor'> 
        <span className='cluster_info_key'>Subnet Ids: </span>
          {props.clusterInfo.subnetIdsArray[0]},
          {props.clusterInfo.subnetIdsArray[1]}, 
          {props.clusterInfo.subnetIdsArray[2]}
        </div>
        <div className='cluster_info_minor'> 
          <span className='cluster_info_key'>Server End Point: </span>{props.clusterInfo.serverEndPoint}
        </div>
        <div className='cluster_info_minor'> 
          <span className='cluster_info_key'>Key Name: </span>{props.clusterInfo.KeyName}
        </div>
        <div className='cluster_info_minor'> 
          <span className='cluster_info_key'>Worker Node Stack Name: </span>
{props.clusterInfo.workerNodeStackName}
        </div>
        <div className='cluster_info_minor'> 
          <span className='cluster_info_key'>Worker Node Role Arn: </span>{props.clusterInfo.nodeInstanceRoleArn}
        </div>
      </div>
    </div>
  );
}

export default ClusterInfoComponent;