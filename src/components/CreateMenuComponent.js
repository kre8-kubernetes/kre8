import React from 'react';

const CreateMenuComponent = (props) => {
  return (
    <div className='create_menu_component_container'>
      <button id='pod' className='create_menu_component_container_form' onClick={props.handleMenuItemToShow}>Create a POD</button>
      <button id='service' className='create_menu_component_container_form' onClick={props.handleMenuItemToShow}>Create a Service</button>
      <button id='deployment' className='create_menu_component_container_form' onClick={props.handleMenuItemToShow}>Create a Deployment</button>
    </div>
  )
}

export default CreateMenuComponent;