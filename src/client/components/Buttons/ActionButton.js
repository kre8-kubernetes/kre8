import React from 'react';

const ActionButton = (props) => {
  const { id, clickHandler, buttonText } = props;
  return (
    <button
      id={ id ? `${id}` : null }
      onClick={ clickHandler }
      className="action_button"
      type="button"
    >
      { buttonText }
    </button>
  );
};

export default ActionButton;
