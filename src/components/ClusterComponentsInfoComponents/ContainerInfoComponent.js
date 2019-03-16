import React from 'react';
import { makeInfoItemFromObjectProperties, makeAddtionalInfoFromArrayOfObjects, makeInfoComponentBody } from '../../helperFunctions/renderFunctions'

const ContainerInfoComponent = (props) => {
  const { data } = props;

  const status = makeInfoItemFromObjectProperties(data, 'container_info_component_item');

  const info = makeInfoComponentBody(data);

  return (
    <div className='container_info_component'>
      {info}
      <div className='more_info_button_item'>
        <button onClick={props.hideNodeInfo} className='popup_info_button'>Close</button>
      </div>
    </div>
  )
}

export default ContainerInfoComponent
