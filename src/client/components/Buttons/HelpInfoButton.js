import React from 'react';

const HelpInfoButton = (props) => {
  const { clickHandler } = props;
  return (
    <button onClick={ clickHandler } className="help_button" type="button">?</button>
  );
};

export default HelpInfoButton;
