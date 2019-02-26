import React from 'react';

const NodeInfoComponent = (props) => {
  console.log('props from node info: ', props);

  return (
    <div className='popup'>
      <div className='popup_inner'>
        <h3>Name: {props.nodeInfoToShow.data.name}</h3>
        <h2>ID: {props.nodeInfoToShow.data.id}</h2>

        <button onClick={props.hideNodeInfo}>Close</button>
      </div>
    </div>
  )
}

export default NodeInfoComponent;