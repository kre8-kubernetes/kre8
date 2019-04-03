import React from 'react';
import { makeInfoComponentBody } from '../../helperFunctions/renderFunctions';

const InfoComponentBody = (props) => {
  const { data } = props;
  const body = makeInfoComponentBody(data);

  return (
    <div className="info_body_component">
      {body}
    </div>
  );
};

export default InfoComponentBody;
