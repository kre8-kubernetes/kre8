import React from 'react';

const CreateMenuItemComponent = (props) => {
  const { 
    handleChange,
    deployment_deploymentName,
    deployment_appName,
    deployment_containerName,
    deployment_image,
    deployment_containerPort,
    deployment_replicas,
    handleCreateDeployment,
    toggleCreateMenuItem,
  } = props;
  return (
    <div className="popup">
      <div className='create_menu_item_component_container'>
        <div className='create_menu_item_component_item'>
          <form>
            <h2>Create a Deployment</h2>
            <h4>Deployment name:</h4>
            <input id='deployment_deploymentName' value={deployment_deploymentName} onChange={handleChange} type="text" name="Deployment name" />
            {props.validator1.message('Deployment name', deployment_deploymentName, 'required')}

            <h4>App name:</h4>
            <input id='deployment_appName' value={deployment_appName} onChange={handleChange} type="text" name="App name" />
            {props.validator1.message('App name', deployment_appName, 'required')}

            <h4>Container name:</h4>
            <input id='deployment_containerName' value={deployment_containerName} onChange={handleChange} type="text" name="Container name" />
            {props.validator1.message('Container name', deployment_containerName, 'required')}

            <h4>Image:</h4>
            <input id='deployment_image' value={deployment_image} onChange={handleChange} type="text" name="Image name" />
            {props.validator1.message('Image', deployment_image, 'required')}

            <h4>Container Port:</h4>
            <input id='deployment_containerPort' value={deployment_containerPort} onChange={handleChange} type="text" name="Container port" />
            {props.validator1.message('Container port', deployment_containerPort, 'required|numeric')}

            <h4>Number of replicas:</h4>
            <input id='deployment_replicas' value={deployment_replicas} onChange={handleChange} type="text" name="Replicas" />
            {props.validator1.message('Number of replicas', deployment_replicas, 'required|numeric')}

          </form>
        </div>
        <div className='create_menu_item_component_item'>
          <button onClick={handleCreateDeployment} className="buttons">Create a Deployment</button>
        </div>
        <div className='create_menu_item_component_item'>
          <button onClick={toggleCreateMenuItem} className="buttons">Close</button>
        </div>
      </div>
    </div>
  )
}

export default CreateMenuItemComponent;