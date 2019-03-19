import React from 'react';
import InfoBodyComponent from './InfoBodyComponent'

const PodInfoComponent = (props) => {
  const { data } = props;

  console.log('data from PodInfoComponent', data);

  return (
    <div className='pod_info_component'>
      <InfoBodyComponent data={data} />
      <div className='more_info_button_item'>
        <button onClick={props.hideNodeInfo} className='popup_info_button'>Close</button>
      </div>
    </div>
  )
}

export default PodInfoComponent