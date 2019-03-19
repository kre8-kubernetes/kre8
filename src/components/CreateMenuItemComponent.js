import React from 'react';
import ActionButton from './Buttons/ActionButtonComponent';
import uuid from 'uuid'

const CreateMenuItemComponent = (props) => {
  const { 
    handleChange,
    handleCloseFormItem,
    menuItemToShow,
    handleCreateDeployment,
    toggleCreateMenuItem,
  } = props;
  const componentNameFormatted = menuItemToShow.charAt(0).toUpperCase() + menuItemToShow.slice(1);
  const formItems = Object.entries(props.inputDataToShow).map((arr, i) => {
    const inputName = arr[0];
    const inputVal = arr[1];
    const id = `${menuItemToShow}_${inputName}`;
    return (
      <div className='create_menu_item_component_inputs_item'>
        {/* <h4>{menuItemToShow} {inputName}:</h4> */}
        <input id={id} key={i} value={inputVal} placeholder={`${menuItemToShow}-${inputName}`} onChange={handleChange} type="text" />
        {/* TODO: error handling in these forms? this validator seems to force a re-render, which causes issues */}
        {/* {props.validator1.message(`${menuItemToShow} name, ${inputName}, required`)} */}
      </div>
    )
  })
  return (
    <div onClick={handleCloseFormItem} className="popup_form">
      <div className='popup_form_inner'>
        <div className='create_menu_item_component_container'>
          {/**** TITLE  ****/}
          <div className='create_menu_item_component_title'>
            <h2>Create a {componentNameFormatted}</h2>
          </div>
          {/**** FORM ****/}
          <div className='create_menu_item_component_inputs'>
            {formItems}
          </div>
          {/**** BUTTONS ****/}
          <div className='create_menu_item_component_buttons'>
            {/* <button onClick={handleCreateDeployment}>Create a {componentNameFormatted}</button> */}
            <ActionButton clickHandler={handleCreateDeployment} buttonText={`Create`}/>
            <button onClick={toggleCreateMenuItem}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateMenuItemComponent;