import React from 'react';
import { makeInfoItemFromObjectProperties, makeAddtionalInfoFromArrayOfObjects, makeInfoComponentBody } from '../../helperFunctions/renderFunctions'

const ApiserverInfoComponet = (props) => {
  const { data } = props;

  const properties = makeInfoItemFromObjectProperties(data, 'apiserver_info_component_item');
  const ports = makeAddtionalInfoFromArrayOfObjects(data.spec.ports,'Ports' , 'apiserver_info_component_additional_items');

  const info = makeInfoComponentBody(data);

  console.log('INFO!!!!!', info);

  return (
    <div className='apiserver_info_component'>

      {/* <div className='apiserver_info_component_item'>
        <p>ID: </p>
        <p>{data.metadata.uid}</p>
      </div>
      <div className='apiserver_info_component_item'>
        <p>Component: </p>
        <p>{data.metadata.labels.component}</p>
      </div>
      <div className='apiserver_info_component_item'>
        <p>Kind: </p>
        <p>{data.kind}</p>
      </div>
      <div className='apiserver_info_component_item'>
        <p>Created At: </p>
        <p>{data.metadata.creationTimestamp}</p>
      </div>
      <div className='apiserver_info_component_item'>
        <p>ClusterIP: </p>
        <p>{data.spec.clusterIP}</p>
      </div>

      {properties}

      {ports} */}

      {info}

      <div className='more_info_button_item'>
        <button onClick={props.hideNodeInfo} className='popup_info_button'>Close</button>
      </div>

    </div>
  )
}

export default ApiserverInfoComponet