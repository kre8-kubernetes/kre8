import React from 'react';
import { makeInfoItemFromObjectProperties, makeAddtionalInfoFromArrayOfObjects, makeInfoComponentBody } from '../../helperFunctions/renderFunctions'

const NodeInfoComponent = (props) => {
  const { data } = props;

  const addresses = data.status.addresses.map((address, i) => {
    return (
      <div className='additional_info_body_item'>
        <div key={i} className='additional_info_body_item_row'>
          <p>{address.type}</p>
          <p>{address.address}</p>
        </div>
      </div>
    )
  });

  const allocatable = Object.entries(data.status.allocatable).map((pair, i) => {
    return (
      <div className='additional_info_body_item'>
        <div key={i} className='additional_info_body_item_row'>
          <p>{pair[0]}</p>
          <p>{pair[1]}</p>
        </div>
      </div>
    )
  });

  const capacity = Object.entries(data.status.capacity).map((pair, i) => {
    return (
      <div className='additional_info_body_item'>
        <div key={i} className='additional_info_body_item_row'>
          <p>{pair[0]}</p>
          <p>{pair[1]}</p>
        </div>
      </div>
    )
  });

  const nodeInfo = Object.entries(data.status.nodeInfo).map((pair, i) => {
    return (
      <div className='additional_info_body_item'>
        <div key={i} className='additional_info_body_item_row'>
          <p>{pair[0]}</p>
          <p>{pair[1]}</p>
        </div>
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
      <div className='info_component_additional_items'>
        <p>Addresses -- </p>
        <div className='additional_info_body_container'>
          <div className='additional_info_body_item'>
            {addresses}
          </div>
        </div>
      </div>
      <div className='info_component_additional_items'>
        <p>Allocatable -- </p>
        <div className='additional_info_body_container'>
          <div className='additional_info_body_item'>
            {allocatable}
          </div>
        </div>
      </div>
      <div className='info_component_additional_items'>
        <p>Capacity -- </p>
        <div className='additional_info_body_container'>
          <div className='additional_info_body_item'>
            {capacity}
          </div>
        </div>
      </div>
      <div className='info_component_additional_items'>
        <p>NodeInfo -- </p>
        <div className='additional_info_body_container'>
          <div className='additional_info_body_item'>
            {nodeInfo}
          </div>
        </div>
      </div>
      <div className='more_info_button_item'>
        <button onClick={props.hideNodeInfo} className='popup_info_button'>Close</button>
      </div>
    </div>
  )
}

export default NodeInfoComponent