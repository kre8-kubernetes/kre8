import React from 'react';
import InfoBodyComponent from './InfoBodyComponent'

const ApiserverInfoComponet = (props) => {
  const { data } = props;

  return (
    <div className='apiserver_info_component'>
      <InfoBodyComponent data={data} />
      <div className='more_info_button_item'>
        <button onClick={props.hideNodeInfo} className='popup_info_button'>Close</button>
      </div>
    </div>
  )
}

export default ApiserverInfoComponet