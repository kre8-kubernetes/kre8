import React from 'react';
import InfoBodyComponent from './InfoBodyComponent';
import CloseButton from '../Buttons/CloseButton';

const ApiserverInfoComponent = (props) => {
  const { data, hideNodeInfo } = props;
  return (
    <div className="apiserver_info_component">
      <CloseButton clickHandler={hideNodeInfo} />
      <InfoBodyComponent data={data} />
    </div>
  );
};

export default ApiserverInfoComponent;
