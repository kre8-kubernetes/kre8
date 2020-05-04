import React from 'react';

/** ------------ ACTION BUTTON ------------------------------
  ** Rendered in the HomeComponent, AWSComponent, ContainerInfoComponent, PodInfoComponent, CreateMenuItemComponent
  *
*/

const ActionButton = (props) => {
  const { id, clickHandler, buttonText } = props;
  if (id) {
    return <button id={id} onClick={clickHandler} className="action_button" type="button">{buttonText}</button>;
  }
  return <button onClick={clickHandler} className="action_button" type="button">{buttonText}</button>;
};

export default ActionButton;
