import React from 'react';

const NodeInfoComponent = (props) => {
  console.log('props from node info: ', props);
  const componentType = props.nodeInfoToShow.data.type;

  return (
    <div className='popup_info'>
      <div className='popup_info_inner'>
        {
          (componentType === "Node") ?
            <div className='node_info_component'>
              <p>Name: {props.nodeInfoToShow.data.name}</p>
              <p>ID: {props.nodeInfoToShow.data.id}</p>
              <p>Creation Date: 2019-02-26</p>
              <p>API Version: v1</p>
              <p>Provider: Kubernetes</p>
              <p>Status: Active</p>
              <p>Disk Space: Sufficient</p>
              <p>Memory Pressure: False</p>
              <p>PID Pressure: False</p>
              <button onClick={props.hideNodeInfo}>Close</button>
            </div>
          : (componentType === "apiserver") ? 
              <div className='apiserver_info_component'>
                This is the api server
                <button onClick={props.hideNodeInfo}>Close</button>
              </div>
          : (componentType === "Pod") ? 
              <div className='pod_info_component'>
                This is the Pod Info
                <button onClick={props.hideNodeInfo}>Close</button>
              </div>
          : (componentType === "Container") ? 
              <div className='container_info_component'>
                This is the Container Info
                <button onClick={props.hideNodeInfo}>Close</button>
              </div>
          : 
              <div className='nothing_info_component'>
                This is the nothing component
                <button onClick={props.hideNodeInfo}>Close</button>
              </div>
        }
      </div>
    </div>
  )
}

export default NodeInfoComponent;