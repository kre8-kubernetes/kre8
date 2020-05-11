import React from 'react';

// TODO (braden): this whole thing probably needs some work
// I made this and it's kind of a mess. Maybe consider a different
// approach to how this is done entirely.

const makeKey = (string, i) => `${string}${String(i)}`;

export const makeInfoItemFromObjectProperties = (dataObject, title) => {
  const additionalData = Object.entries(dataObject).reduce((acc, item, i) => {
    if (typeof item[1] !== 'object') {
      acc.push(
        <div key={ makeKey(item, i) } className="additional_info_body_item">
          <div className="additional_info_body_item_row">
            <p>{ item[0][0].toUpperCase() + item[0].slice(1) }</p>
            <p>{ item[1] }</p>
          </div>
        </div>,
      );
    }
    return acc;
  }, []);

  return (
    <div className="info_component_additional_items">
      <p>{ `${title} -- ` }</p>
      <div className="additional_info_body_container">
        <div className="additional_info_body_item">
          { additionalData }
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line arrow-body-style
export const makeInfoComponentBody = (data) => {
  // take data (object) and iterate over the properties
  return Object.entries(data).reduce((acc, item, outerIndex) => {
    // if typeof is not an object then return (insertComponent)_info_component_item
    if (typeof item[1] !== 'object') {
      acc.push(
        <div key={ makeKey(item[1], outerIndex) } className="info_component_item">
          <p>{ item[0][0].toUpperCase() + item[0].slice(1) }</p>
          <p>{ item[1] }</p>
        </div>,
      );
    }

    // If property value is array, create list and nest inside div
    // (insertComponent _info_component_additional_items
    if (
      Array.isArray(item[1])
      && item[0] !== 'children'
      && item[0] !== 'containers'
      && item[0] !== 'containerStatuses'
      && item[0] !== 'conditions'
      && item[0] !== 'tolerations'
    ) {
      const additionalData = item[1].map((obj, middleIndex) => {
        const items = Object.entries(obj).map((prop, innerIndex) => {
          if (typeof prop[1] !== 'object') {
            return (
              <div key={ makeKey(prop[0], innerIndex) } className="additional_info_body_item_row">
                <p>{ prop[0] }</p>
                <p>{ prop[1] }</p>
              </div>
            );
          }
          return null;
        });
        return (
          <div key={ makeKey('addDate', middleIndex) } className="additional_info_body_item">
            { items }
          </div>
        );
      });
      acc.push(
        <div key={ makeKey('infoAddItem', outerIndex) } className="info_component_additional_items">
          <p>{ `${item[0]} -- ` }</p>
          <div className="additional_info_body_container">
            { additionalData }
          </div>
        </div>,
      );
    }
    // if propety value is an object then recursively call this function with that object
    if (item[1].constructor === Object) {
      acc.push(makeInfoComponentBody(item[1]));
    }
    return acc;
  }, []);
};
