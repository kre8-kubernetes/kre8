import React from 'react';

const CreateMenuComponent = (props) => {
  const { handleMenuItemToShow } = props;
  return (
    <div className="create_menu_component_container">
      <button id="pod" className="create_menu_component_container_button" onClick={handleMenuItemToShow} type="button">Create a Pod</button>
      <button id="service" className="create_menu_component_container_button" onClick={handleMenuItemToShow} type="button">Create a Service</button>
      <button id="deployment" className="create_menu_component_container_button" onClick={handleMenuItemToShow} type="button">Create a Deployment</button>
    </div>
  );
};

export default CreateMenuComponent;
