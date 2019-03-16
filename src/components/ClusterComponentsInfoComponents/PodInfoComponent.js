import React from 'react';
import { makeInfoItemFromObjectProperties, makeAddtionalInfoFromArrayOfObjects, makeInfoComponentBody } from '../../helperFunctions/renderFunctions'

const PodInfoComponent = (props) => {
  const { data } = props;

  console.log('data from PodInfoComponent', data);



  // const ownerReferences = data.metadata.ownerReferences.map((ownerRefObj, i) => {
  //   console.log('ownerRef', ownerRefObj);
  //   return (
  //     Object.entries(ownerRefObj).map((item, i) => {
  //       return (
  //         <div key={i} className='additional_info_body_item'>
  //           <p>{item[0]}</p>
  //           <p>{item[1]}</p>
  //         </div>
  //       );
  //     })
  //   );
  // });

  // const status = Object.entries(data.status).reduce((acc, item, i) => {
  //   if (typeof item[1] !== 'object') {
  //     acc.push(
  //       <div key={i} className='additional_info_body_item'>
  //         <p>{item[0]}</p>
  //         <p>{item[1]}</p>
  //       </div>
  //     )
  //   }
  //   return acc;
  // }, []);

  // const specs = Object.entries(data.spec).reduce((acc, item, i) => {
  //   if (typeof item[1] !== 'object') {
  //     acc.push(
  //       <div key={i} className='additional_info_body_item'>
  //         <p>{item[0]}</p>
  //         <p>{item[1]}</p>
  //       </div>
  //     )
  //   }
  //   return acc;
  // }, []);

  const info = makeInfoComponentBody(data);

  console.log('info from podInfoComponent', info);

  return (
    <div className='pod_info_component'>
      {/* <div className='pod_info_component_item'>
        <p>ID</p>
        <p>{data.metadata.uid}</p>
      </div>
      <div className='pod_info_component_item'>
        <p>Component Name</p>
        <p>{data.metadata.name}</p>
      </div>
      <div className='pod_info_component_item'>
        <p>Kind</p>
        <p>{data.kind}</p>
      </div>
      <div className='pod_info_component_item'>
        <p>Created At</p>
        <p>{data.metadata.creationTimestamp}</p>
      </div>
      <div className='pod_info_component_additional_items'>
        <p>Owner References -- </p>
        <div className='additional_info_body'>
          {ownerReferences}
        </div>
      </div>
      <div className='pod_info_component_additional_items'>
        <p>Specs -- </p>
        <div className='additional_info_body'>
          {specs}
        </div>
      </div>
      <div className='pod_info_component_additional_items'>
        <p>Status -- </p>
        <div className='additional_info_body'>
          {status}
        </div>
      </div> */}

      {info}
      <div className='more_info_button_item'>
        <button onClick={props.hideNodeInfo} className='popup_info_button'>Close</button>
      </div>
    </div>
  )
}

export default PodInfoComponent