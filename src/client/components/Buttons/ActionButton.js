import React from 'react';

// TODO: why isn't it liking the else?

const ActionButton = (props) => {
  const { id, clickHandler, buttonText } = props;
  if (props.id) {
    return <button id={id} onClick={clickHandler} className="action_button" type="button">{buttonText}</button>;
  } else {
    return <button onClick={clickHandler} className="action_button" type="button">{buttonText}</button>;
  }
};

export default ActionButton;
