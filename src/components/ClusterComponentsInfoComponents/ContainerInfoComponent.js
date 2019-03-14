import React from 'react';

const ContainerInfoComponent = (props) => {
  const { data } = props;

  const status = Object.entries(data).reduce((acc, item, i) => {
    if (typeof item[1] !== 'object') {
      acc.push(
        <div className='container_info_component_item'>
          <p>{item[0]}</p>
          <p>{item[1]}</p>
        </div>
      )
    }
    return acc;
  }, []);

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