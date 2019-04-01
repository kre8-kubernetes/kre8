import React from 'react';

const ClusterInfoComponent = (props) => {
  const { clusterInfo } = props;

  return (
    <div className="cluster_info_container">
      <div className="cluster_info_major">
        <span className="cluster_info_key">CLUSTER NAME: </span>
        <span className="cluster_info_value">{clusterInfo.clusterName}</span>
      </div>
      <div className="cluster_info_minor">
        <span className="cluster_info_key">CLUSTER ARN: </span>
        <span className="cluster_info_value">{clusterInfo.clusterArn}</span>
      </div>
      <div className="cluster_info_major">
        <span className="cluster_info_key">IAM ROLE: </span>
        <span className="cluster_info_value">{clusterInfo.iamRoleName}</span>
      </div>
      <div className="cluster_info_minor">
        <span className="cluster_info_key">IAM ROLE ARN: </span>
        <span className="cluster_info_value">{clusterInfo.iamRoleArn}</span>
      </div>
      <div className="cluster_info_major">
        <span className="cluster_info_key"> STACK NAME: </span>
        <span className="cluster_info_value">{clusterInfo.stackName}</span>
      </div>
      <div className="cluster_info_minor">
        <span className="cluster_info_key">VPC ID: </span>
        <span className="cluster_info_value">{clusterInfo.vpcId}</span>
      </div>
      <div className="cluster_info_minor">
        <span className="cluster_info_key">SECURITY GROUP ID: </span>
        <span className="cluster_info_value">{clusterInfo.securityGroupIds}</span>
      </div>
      <div className="cluster_info_minor">
        <span className="cluster_info_key">SUBNET IDS: </span>
        <span className="cluster_info_value">{clusterInfo.subnetIdsArray[0]}, {clusterInfo.subnetIdsArray[1]}, {clusterInfo.subnetIdsArray[2]}</span>
      </div>
      <div className="cluster_info_minor">
        <span className="cluster_info_key">SERVER END POINT: </span>
        <span className="cluster_info_value">{clusterInfo.serverEndPoint}</span>
      </div>
      <div className="cluster_info_minor">
        <span className="cluster_info_key">KEY NAME: </span>
        <span className="cluster_info_value">{clusterInfo.KeyName}</span>
      </div>
    </div>
  );
};

export default ClusterInfoComponent;
