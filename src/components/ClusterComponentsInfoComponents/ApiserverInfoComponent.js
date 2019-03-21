import React from 'react';
import InfoBodyComponent from './InfoBodyComponent'
import ActionButton from '../Buttons/ActionButton'

const ApiserverInfoComponet = (props) => {
  const { data } = props;

  return (
    <div className='apiserver_info_component'>
      <InfoBodyComponent data={data} />
      <div className='more_info_button_item'>
        <ActionButton clickHandler={props.hideNodeInfo} buttonText={`Close`}/> 
      </div>
    </div>
  )
}

export default ApiserverInfoComponet