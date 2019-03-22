import React from 'react'

export const makeInfoItemFromObjectProperties = (dataObject, title) => {
  const additionalData = Object.entries(dataObject).reduce((acc, item, i) => {
    if (typeof item[1] !== 'object') {
      acc.push(
        <div key={i} className='additional_info_body_item'>
          <div className='additional_info_body_item_row'>
            <p>{item[0][0].toUpperCase() + item[0].slice(1)}</p>
            <p>{item[1]}</p>
          </div>
        </div>
      )
    }
    return acc;
  }, []);

  return (
    <div className='info_component_additional_items'>
      <p>{title} -- </p>
      <div className='additional_info_body_container'>
        <div className='additional_info_body_item'>
          {additionalData}
        </div>
      </div>
    </div>
  )
}

export const makeInfoComponentBody = (data) => {
  // take data (object) and iterate over the properties
  return Object.entries(data).reduce((acc, item, i) => {
    // if typeof is not an object then return (insertComponent)_info_component_item
    if (typeof item[1] !== 'object') {
      acc.push(
        <div key={i} className='info_component_item'>
          <p>{item[0][0].toUpperCase() + item[0].slice(1)}</p>
          <p>{item[1]}</p>
        </div>
      )
    }

    // if property value is an array then create a list and nest it inside of div (insertComponent)_info_component_additional_items
    if (Array.isArray(item[1]) && item[0] !== 'children' && item[0] !== 'containers' && item[0] !== 'containerStatuses' && item[0] !== 'conditions' && item[0] !== 'tolerations') {
      const additionalData = item[1].map((obj, i) => {
        
        const items = Object.entries(obj).map((prop, i) => {
          if (typeof prop[1] !== 'object') {
            return (
              <div key={i} className='additional_info_body_item_row'>
                <p>{prop[0]}</p>
                <p>{prop[1]}</p>
              </div>
            );
          }
        })

        return (
          <div key={i} className='additional_info_body_item'>
            {items}
          </div>
        )
      });

      acc.push(
        <div key={i} className='info_component_additional_items'>
          <p>{item[0]} -- </p>
          <div className='additional_info_body_container'>
            {additionalData}
          </div>
        </div>
      )
    }

    // if propety value is an object then recursively call this function with that object
    if (item[1].constructor === Object) {
      acc.push(makeInfoComponentBody(item[1]))
    }

    return acc;
  }, []);
}
