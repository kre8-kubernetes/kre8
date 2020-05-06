import React from 'react';
import { makeInfoItemFromObjectProperties } from '../../utils/renderFunctions';
import CloseButton from '../Buttons/CloseButton';

const NodeInfoComponent = (props) => {
  const { data, hideNodeInfo } = props;

  const addresses = data.status.addresses.map((address, i) => (
    <div key={i} className="additional_info_body_item">
      <div className="additional_info_body_item_row">
        <p>{address.type}</p>
        <p>{address.address}</p>
      </div>
    </div>
  ));

  const allocatable = makeInfoItemFromObjectProperties(data.status.allocatable, 'Allocatable');
  const capacity = makeInfoItemFromObjectProperties(data.status.capacity, 'Capacity');
  const nodeInfo = makeInfoItemFromObjectProperties(data.status.nodeInfo, 'NodeInfo');

  return (
    <div className="node_info_component">
      <CloseButton clickHandler={hideNodeInfo} />
      <div className="node_info_component_item">
        <p>ID</p>
        <p>{data.metadata.uid}</p>
      </div>
      <div className="node_info_component_item">
        <p>Component Name</p>
        <p>{data.metadata.name}</p>
      </div>
      <div className="node_info_component_item">
        <p>Kind</p>
        <p>{data.kind}</p>
      </div>
      <div className="node_info_component_item">
        <p>Created At</p>
        <p>{data.metadata.creationTimestamp}</p>
      </div>
      <div className="info_component_additional_items">
        <p>Addresses -- </p>
        <div className="additional_info_body_container">
          <div className="additional_info_body_item">
            {addresses}
          </div>
        </div>
      </div>
      {allocatable}
      {capacity}
      {nodeInfo}
    </div>
  );
};

export default NodeInfoComponent;
