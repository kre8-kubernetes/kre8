import React from 'react';
import InfoBodyComponent from './InfoBodyComponent';
import ActionButton from '../Buttons/ActionButton';
import CloseButton from '../Buttons/CloseButton';

const PodInfoComponent = (props) => {
  const { data, deleteNode, hideNodeInfo } = props;
  return (
    <div className="pod_info_component">
      <CloseButton clickHandler={hideNodeInfo} />
      <InfoBodyComponent data={data} />
      <div className="more_info_button_item">
        <ActionButton id="pod_delete_button" clickHandler={deleteNode} buttonText="Delete Deployment" />
        {/* <button className="action_button" onClick={deleteNode} type="button">Delete Deployment</button> */}
      </div>
    </div>
  );
};

export default PodInfoComponent;
