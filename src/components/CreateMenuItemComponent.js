import React from 'react';

const CreateMenuItemComponent = (props) => {
  const { 
    handleChange,
    handleCloseFormItem,
    menuItemToShow,
    handleCreateDeployment,
    toggleCreateMenuItem,
  } = props;
  const formItems = Object.entries(props.inputDataToShow).map((arr) => {
    const inputName = arr[0];
    const inputVal = arr[1];
    const id = `${menuItemToShow}_${inputName}`;
    return (
      <div className='create_menu_item_form_item'>
        <h4>{menuItemToShow} {inputName}:</h4>
        <input id={id} value={inputVal} onChange={handleChange} type="text" />
        {/* TODO: error handling in these forms? this validator seems to force a re-render, which causes issues */}
        {/* {props.validator1.message(`${menuItemToShow} name, ${inputName}, required`)} */}
      </div>
    )
  })
  return (
    <div onClick={handleCloseFormItem} className="popup">
      <div className='create_menu_item_component_container'>
        {/**** TITLE  ****/}
        <div className='create_menu_item_component_item'>
          <h2>Create a Deployment</h2>
        </div>
        {/**** FORM ****/}
        <div className='create_menu_item_component_item'>
          <div className='create_menu_item_form_container'>
            {formItems}
          </div>
        </div>
        {/**** BUTTONS ****/}
        <div className='create_menu_item_component_item'>
          <button onClick={handleCreateDeployment} className="buttons">Create a Deployment</button>
          <button onClick={toggleCreateMenuItem} className="buttons">Close</button>
        </div>
      </div>
    </div>
  )
}

export default CreateMenuItemComponent;