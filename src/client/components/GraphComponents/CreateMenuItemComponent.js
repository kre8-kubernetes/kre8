import React from 'react';
import ActionButton from '../Buttons/ActionButton';
import CloseButton from '../Buttons/CloseButton';

const CreateMenuItemComponent = (props) => {
  const {
    handleChange,
    menuItemToShow,
    handleFormClose,
    handleFunction,
    errors,
    infoText,
    infoButton,
    inputDataToShow,
  } = props;

  const componentNameFormatted = menuItemToShow.charAt(0).toUpperCase() + menuItemToShow.slice(1);
  const formItems = Object.entries(inputDataToShow).map((arr, i) => {
    const inputName = arr[0];
    const inputVal = arr[1];
    const placeholder = inputName.charAt(0).toUpperCase() + inputName.split(/(?=[A-Z])/).join(' ').slice(1);
    const id = `${menuItemToShow}_${inputName}`;
    return (
      <div key={i} className="create_menu_item_component_inputs_item">
        <input id={id} value={inputVal} placeholder={placeholder} onChange={handleChange} type="text" />
        <div className="errorClass">{errors[menuItemToShow][inputName]}</div>
      </div>
    );
  });

  return (
    <div className="popup_form_inner">
      <div className="create_menu_item_component_container">
        {/** ***TITLE*** */}
        {/* <button onClick={handleFormClose} className="close_popup_button" type="button">X</button> */}
        <CloseButton clickHandler={handleFormClose} />
        <div className="create_menu_item_component_title">
          <h2>Create a {componentNameFormatted}</h2>
        </div>
        <div className="create_menu_item_component_help_info">
          <p>{infoText}</p><p>{infoButton}</p>
        </div>
        {/** ** FORM *** */}
        <div className="create_menu_item_component_inputs">
          {formItems}
        </div>
        {/** ** BUTTONS *** */}
        <div className="create_menu_item_component_buttons">
          <ActionButton clickHandler={handleFunction} buttonText="Create" />
        </div>
      </div>
    </div>
  );
};

export default CreateMenuItemComponent;
