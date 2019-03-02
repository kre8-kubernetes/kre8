import React from 'react';

const NodeInfoComponent = (props) => {
  console.log('props from node info: ', props);

  return (
    <div className='popup'>
      <div className='popup_inner'>
        <div className='node_info_component'>
        <h3>Name: {props.nodeInfoToShow.data.name}</h3>
        <h2>ID: {props.nodeInfoToShow.data.id}</h2>
        <p>Creation Date: 2019-02-26</p>
        <p>API Version: v1</p>
        <p>Provider: Kubernetes</p>
        <p>Status: Active</p>
        <p>Disk Space: Sufficient</p>
        <p>Memory Pressure: False</p>
        <p>PID Pressure: False</p>
        <button onClick={props.hideNodeInfo}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default NodeInfoComponent;