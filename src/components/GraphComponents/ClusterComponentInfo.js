import React from 'react';

import ApiserverInfoComponent from '../ClusterComponentsInfoComponents/ApiserverInfoComponent';
import NodeInfoComponent from '../ClusterComponentsInfoComponents/NodeInfoComponent';
import PodInfoComponent from '../ClusterComponentsInfoComponents/PodInfoComponent'
import ContainerInfoComponent from '../ClusterComponentsInfoComponents/ContainerInfoComponent'

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
            <PodInfoComponent 
              data={props.nodeInfoToShow.data}
              hideNodeInfo={props.hideNodeInfo}
              deleteNode={props.deleteNode}
            />
          : (componentType === "Container") ? 
            <ContainerInfoComponent
              data={props.nodeInfoToShow.data}
              hideNodeInfo={props.hideNodeInfo}
            />
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