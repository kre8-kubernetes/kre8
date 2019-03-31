import React from 'react';
import InfoBodyComponent from './InfoBodyComponent';
import ActionButton from '../Buttons/ActionButton'

const PodInfoComponent = (props) => {
  const { data } = props;

  console.log('data from PodInfoComponent', data);

  return (
    <div className='pod_info_component'>
      <InfoBodyComponent data={data} />
      <div className='more_info_button_item'>
        <ActionButton clickHandler={props.hideNodeInfo} buttonText={`Close`} /> 
      <button className='action_button' onClick={props.deleteNode}>Delete Deployment</button>
      </div>
    </div>
  )
}

export default PodInfoComponent