import React from 'react';
import { makeInfoItemFromObjectProperties, makeAddtionalInfoFromArrayOfObjects } from '../../helperFunctions/renderFunctions'

const ContainerInfoComponent = (props) => {
  const { data } = props;

  const status = makeInfoItemFromObjectProperties(data, 'container_info_component_item');

  return (
    <div className='container_info_component'>
      {status}
      <div className='more_info_button_item'>
        <button onClick={props.hideNodeInfo} className='popup_info_button'>Close</button>
      </div>
    </div>
  )
}

export default ContainerInfoComponent
