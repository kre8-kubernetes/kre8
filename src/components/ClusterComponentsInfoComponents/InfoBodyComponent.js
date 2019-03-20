import React from 'react'
import { makeInfoComponentBody } from '../../helperFunctions/renderFunctions'

const InfoComponentBody = (props) => {

  const body = makeInfoComponentBody(props.data)

  return (
    <div className='info_body_component'>
      {body}
    </div>
  )
}

export default InfoComponentBody