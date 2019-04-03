import React from 'react';
import InfoBodyComponent from './InfoBodyComponent';
import ActionButton from '../Buttons/ActionButton';

const ApiserverInfoComponent = (props) => {
  const { data, hideNodeInfo } = props;
  return (
    <div className="apiserver_info_component">
      <InfoBodyComponent data={data} />
      <div className="more_info_button_item">
        <ActionButton clickHandler={hideNodeInfo} buttonText="Close" />
      </div>
    </div>
  );
};

export default ApiserverInfoComponent;
