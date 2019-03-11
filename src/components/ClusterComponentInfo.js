import React from 'react';

import ApiserverInfoComponent from './ClusterComponentsInfoComponents/ApiserverInfoComponent';
import NodeInfoComponent from './ClusterComponentsInfoComponents/NodeInfoComponent';

const ClusterInfoComponent = (props) => {
  console.log('props from node info: ', props);
  const componentType = props.nodeInfoToShow.data.type;
  const data = props.nodeInfoToShow.data.data;

  console.log('componentType: ', componentType);
  return (
    <div className='popup_info'>
      <div className='popup_info_inner'>
        {
            (componentType === "Node") ?
              <NodeInfoComponent
                data={props.nodeInfoToShow.data}
                hideNodeInfo={props.hideNodeInfo}
              />
          : (componentType === "apiserver") ? 
              <ApiserverInfoComponent 
                data={data}
                hideNodeInfo={props.hideNodeInfo}
              />
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

export default ClusterInfoComponent;