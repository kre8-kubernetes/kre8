import React from 'react';

const CreateMenuComponent = (props) => {
  return (
    <div className='create_menu_component_container'>
      <button id='pod_form' onClick={props.handleMenuItemToShow}>Create a POD</button>
      <button id='container_form' onClick={props.handleMenuItemToShow}>Create a Container</button>
      <button id='deployment_form' onClick={props.handleMenuItemToShow}>Create a Deployment</button>
    </div>
  )
}

export default CreateMenuComponent;