import React from 'react';
import InfoBodyComponent from './InfoBodyComponent';
import ActionButton from '../Buttons/ActionButton';
import CloseButton from '../Buttons/CloseButton';

const ContainerInfoComponent = (props) => {
  const { data, hideNodeInfo } = props;

  return (
    <div className="container_info_component">
      <CloseButton clickHandler={hideNodeInfo} />
      <InfoBodyComponent data={data} />
      {/* <div className="more_info_button_item">
        <ActionButton clickHandler={hideNodeInfo} buttonText="Close" />
      </div> */}
    </div>
  );
};

export default ContainerInfoComponent;
