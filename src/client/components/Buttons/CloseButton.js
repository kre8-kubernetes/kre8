import React from 'react';

const CloseButton = (props) => {
  const { clickHandler } = props;
  return (
    <button onClick={clickHandler} className="close_popup_button" type="button">X</button>
  );
};

export default CloseButton;
