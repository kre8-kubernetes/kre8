import React from 'react';

const ClusterInfoComponent = (props) => {
  return (
    <div className='cluster_info_container'>
      <div className='cluster_info_container_item'>
        Cluster Name: {props.clusterInfo.name}
      </div>
    </div>
  );
}

export default ClusterInfoComponent;