import React from 'react'

const ActionButton = (props) => {
  return (
    <button onClick={props.clickHandler} className='action_button'>{props.buttonText}</button>
  )
}

export default ActionButton