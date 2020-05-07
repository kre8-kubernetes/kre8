import React from 'react';
import { makeInfoComponentBody } from '../../utils/renderFunctions';

const InfoComponentBody = ({ data }) => {
  let body = [];
  if (data) {
    body = makeInfoComponentBody(data);
  }

  return (
    <div className="info_body_component">
      { body }
    </div>
  );
};

export default InfoComponentBody;
