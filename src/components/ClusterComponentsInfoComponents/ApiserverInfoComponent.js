import React from 'react';

const ApiserverInfoComponet = (props) => {
  const { data } = props;
  console.log('data', data);

  const ports = data.spec.ports.map((port) => {
    return (
      <div className='apiserver_info_ports_body_item'>
        <p>Name - {port.name}</p>
        <p>Port - {port.port}</p>
        <p>Protocol - {port.name}</p>
        <p>targetPort - {port.targetPort}</p>
      </div>
    )
  })
  return (
    <div className='apiserver_info_component'>

      <div className='apiserver_info_component_item'>
        <p>ID: </p>
        <p>{data.metadata.uid}</p>
      </div>
      <div className='apiserver_info_component_item'>
        <p>Component: </p>
        <p>{data.metadata.labels.component}</p>
      </div>
      <div className='apiserver_info_component_item'>
        <p>Kind: </p>
        <p>{data.kind}</p>
      </div>
      <div className='apiserver_info_component_item'>
        <p>Created At: </p>
        <p>{data.metadata.creationTimestamp}</p>
      </div>
      <div className='apiserver_info_component_item'>
        <p>ClusterIP: </p>
        <p>{data.spec.clusterIP}</p>
      </div>

      <div className='apiserver_info_component_item' id="apiserver_info_ports">
        <p>Ports -- </p>
        <div className='apiserver_info_ports_body'>
          {ports}
        </div>
      </div>

      <div className='apiserver_info_component_item' id='popup_info_button'>
        <button onClick={props.hideNodeInfo}>Close</button>
      </div>

    </div>
  )
}

export default ApiserverInfoComponet