import React from 'react';
import InfoBodyComponent from './InfoBodyComponent'

const ContainerInfoComponent = (props) => {
  const { data } = props;

  return (
    <div className='container_info_component'>
      <InfoBodyComponent data={data} />
      <div className='more_info_button_item'>
        <button onClick={props.hideNodeInfo} className='popup_info_button'>Close</button>
      </div>
    </div>
  )
}

export default ContainerInfoComponent
