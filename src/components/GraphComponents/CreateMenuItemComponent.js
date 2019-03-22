import React from 'react';
import ActionButton from '../Buttons/ActionButton';

const CreateMenuItemComponent = (props) => {
  const { 
    handleChange,
    handleCloseFormItem,
    menuItemToShow,
    toggleCreateMenuItem,
    handleFunction,
  } = props;

  const componentNameFormatted = menuItemToShow.charAt(0).toUpperCase() + menuItemToShow.slice(1);
  
  const formItems = Object.entries(props.inputDataToShow).map((arr, i) => {
    const inputName = arr[0];
    const inputVal = arr[1];
    const id = `${menuItemToShow}_${inputName}`;
    return (
      <div key={i} className='create_menu_item_component_inputs_item'>
        <input id={id} value={inputVal} placeholder={`${menuItemToShow}-${inputName}`} onChange={handleChange} type="text" />
        {/* TODO: error handling in these forms? this validator seems to force a re-render, which causes issues */}
        {/* {props.validator1.message(`${menuItemToShow} name, ${inputVal}, 'required'`)} */}
      </div>
    )
  })

  return (
    <div onClick={handleCloseFormItem} className="popup_form">
      <div className='popup_form_inner'>
        <button onClick={toggleCreateMenuItem} className='close_popup_button'>X</button>
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
            <ActionButton clickHandler={handleFunction} buttonText={`Create`}/>
          </div>
        </div>
      </div>
    </div>
  )
}


// const obj = {
//   'pod-podName': 'required, lowercase',
//   'service-appName': 'lowercase',

// }
export default CreateMenuItemComponent;