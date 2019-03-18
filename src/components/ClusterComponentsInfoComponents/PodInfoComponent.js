import React from 'react';
import { makeInfoItemFromObjectProperties, makeAddtionalInfoFromArrayOfObjects, makeInfoComponentBody } from '../../helperFunctions/renderFunctions'

const PodInfoComponent = (props) => {
  const { data } = props;

  console.log('data from PodInfoComponent', data);

  const info = makeInfoComponentBody(data);

  return (
    <div className='pod_info_component'>
      {info}
      <div className='more_info_button_item'>
        <button onClick={props.hideNodeInfo} className='popup_info_button'>Close</button>
      </div>
    </div>
  )
}

export default PodInfoComponent