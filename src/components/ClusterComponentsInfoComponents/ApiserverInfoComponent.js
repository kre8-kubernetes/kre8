import React from 'react';
import { makeInfoItemFromObjectProperties, makeAddtionalInfoFromArrayOfObjects, makeInfoComponentBody } from '../../helperFunctions/renderFunctions'

const ApiserverInfoComponet = (props) => {
  const { data } = props;

  const info = makeInfoComponentBody(data);

  return (
    <div className='apiserver_info_component'>

      {info}

      <div className='more_info_button_item'>
        <button onClick={props.hideNodeInfo} className='popup_info_button'>Close</button>
      </div>

    </div>
  )
}

export default ApiserverInfoComponet