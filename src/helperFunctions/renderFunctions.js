import React from 'react'

export const makeInfoItemFromObjectProperties = (data, className) => {
  return Object.entries(data).reduce((acc, item, i) => {
    if (typeof item[1] !== 'object') {
      acc.push(
        <div key={i} className={className}>
          <p>{item[0][0].toUpperCase() + item[0].slice(1)}</p>
          <p>{item[1]}</p>
        </div>
      )
    }
    return acc;
  }, []);
}

export const makeAddtionalInfoFromArrayOfObjects = (data, title, className) => {
  console.log('data', data);
  const additionalData = data.map((object) => {
    return (
      Object.entries(object).map((prop, i) => {
        return (
          <div key={i} className='additional_info_body_item'>
            <p>{prop[0]}</p>
            <p>{prop[1]}</p>
          </div>
        );
      })
    )
  })

  return (
    <div className={className}>
      <p>{title} -- </p>
      <div className='additional_info_body'>
        {additionalData}
      </div>
    </div>
  )
}

