import React from 'react';
import uuid from 'uuid'

const NodeInfoComponent = (props) => {
  const { data } = props;

  const addresses = data.status.addresses.map((address, i) => {
    return (
      <div key={i} className='additional_info_body_items'>
        <p>{address.type}</p>
        <p>{address.address}</p>
      </div>
    )
  });
  const allocatable = Object.entries(data.status.allocatable).map((pair, i) => {
    return (
      <div key={i} className='additional_info_body_items'>
        <p>{pair[0]}</p>
        <p>{pair[1]}</p>
      </div>
    )
  });
  const capacity = Object.entries(data.status.capacity).map((pair, i) => {
    return (
      <div key={i} className='additional_info_body_items'>
        <p>{pair[0]}</p>
        <p>{pair[1]}</p>
      </div>
    )
  });
  const nodeInfo = Object.entries(data.status.nodeInfo).map((pair, i) => {
    return (
      <div key={i} className='additional_info_body_items'>
        <p>{pair[0]}</p>
        <p>{pair[1]}</p>
      </div>
    )
  });

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
      <div className='node_info_component_addtional_items'>
        <p>Addresses -- </p>
        <div className='addtional_info_body'>
          {addresses}
        </div>
      </div>
      <hr>
      <div className='node_info_component_additional_items'>
        <p>Allocatable -- </p>
        <div className='additional_info_body'>
          {allocatable}
        </div>
      </div>
      <div className='node_info_component_additional_items'>
        <p>Capacity -- </p>
        <div className='additional_info_body'>
          {capacity}
        </div>
      </div>
      <div className='node_info_component_additional_items'>
        <p>NodeInfo -- </p>
        <div className='additional_info_body'>
          {nodeInfo}
        </div>
      </div>
      <div className='node_info_component_item' id='popup_info_button'>
        <button onClick={props.hideNodeInfo}>Close</button>
      </div>
    </div>
  )
}

export default NodeInfoComponent