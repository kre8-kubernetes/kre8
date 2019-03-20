import React from 'react';

const HelpInfoButton = (props) => {
  return (
    <button onClick={props.clickHandler} className='help_button'>?</button>
  )
}

export default HelpInfoButton