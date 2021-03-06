import React from 'react';
import InfoBodyComponent from './InfoBodyComponent';
import CloseButton from '../Buttons/CloseButton';

const ContainerInfoComponent = (props) => {
  const { data, hideNodeInfo } = props;

  return (
    <div className="container_info_component">
      <CloseButton clickHandler={ hideNodeInfo } />
      <InfoBodyComponent data={ data } />
    </div>
  );
};

export default ContainerInfoComponent;
