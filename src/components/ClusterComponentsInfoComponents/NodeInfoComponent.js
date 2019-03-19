import React from 'react';
import { makeInfoItemFromObjectProperties, makeInfoComponentBody } from '../../helperFunctions/renderFunctions'

const NodeInfoComponent = (props) => {
  const { data } = props;

  const addresses = data.status.addresses.map((address, i) => {
    return (
      <div key={i} className='additional_info_body_item'>
        <div className='additional_info_body_item_row'>
          <p>{address.type}</p>
          <p>{address.address}</p>
        </div>
      </div>
    )
  });

  const allocatable = makeInfoItemFromObjectProperties(data.status.allocatable, 'Allocatable');
  const capacity = makeInfoItemFromObjectProperties(data.status.capacity, 'Capacity')
  const nodeInfo = makeInfoItemFromObjectProperties(data.status.nodeInfo, 'NodeInfo');

  return (
    <div className='node_info_component'>
      <div className='node_info_component_item'>
        <p>ID</p>
        <p>{data.metadata.uid}</p>
      </div>
      <div className='node_info_component_item'>
        <p>Component Name</p>
        <p>{data.metadata.name}</p>
      </div>
      <div className='node_info_component_item'>
        <p>Kind</p>
        <p>{data.kind}</p>
      </div>
      <div className='node_info_component_item'>
        <p>Created At</p>
        <p>{data.metadata.creationTimestamp}</p>
      </div>
      <div className='info_component_additional_items'>
        <p>Addresses -- </p>
        <div className='additional_info_body_container'>
          <div className='additional_info_body_item'>
            {addresses}
          </div>
        </div>
      </div>
      {allocatable}
      {capacity}
      {nodeInfo}
      <div className='more_info_button_item'>
        <button onClick={props.hideNodeInfo} className='popup_info_button'>Close</button>
      </div>
    </div>
  )
}

export default NodeInfoComponent