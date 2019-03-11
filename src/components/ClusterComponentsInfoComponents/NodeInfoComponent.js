import React from 'react';

const NodeInfoComponent = (props) => {
  const { data } = props;

  return (
    <div className='node_info_component'>
      <div className='node_info_component_item'>
        <p>ID - {data.metadata.uid}</p>
      </div>
      <div className='node_info_component_item'>
        <p>Component Name - {data.metadata.name}</p>
      </div>
      <div className='node_info_component_item'>
        <p>Kind - {data.kind}</p>
      </div>
      <div className='node_info_component_item'>
        <p>Created At - {data.metadata.creationTimestamp}</p>
      </div>
      <div className='node_info_component_item'>
        <p>ID - {data.metadata.uid}</p>
      </div>
      <button onClick={props.hideNodeInfo}>Close</button>
    </div>
  )
}

export default NodeInfoComponent