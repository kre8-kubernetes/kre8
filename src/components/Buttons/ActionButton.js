import React from 'react'

const ActionButton = (props) => {
  if (props.id) {
    return <button id={props.id} onClick={props.clickHandler} className='action_button'>{props.buttonText}</button>
  } else {
    return <button onClick={props.clickHandler} className='action_button'>{props.buttonText}</button>
  }
}

export default ActionButton