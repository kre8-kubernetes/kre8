import React from 'react';
import ApiserverInfoComponent from './ApiserverInfoComponent';
import NodeInfoComponent from './NodeInfoComponent';
import PodInfoComponent from './PodInfoComponent';
import ContainerInfoComponent from './ContainerInfoComponent';
import OutsideClick from '../../utils/OutsideClick';

const NODE = 'Node';
const API_SERVER = 'apiserver';
const POD = 'Pod';
const CONTAINER = 'Container';

const ClusterInfoComponent = (props) => {
  const {
    hideNodeInfo,
    deleteNode,
    nodeInfoToShow,
    loadingScreen,
  } = props;

  const componentType = nodeInfoToShow.data.type;
  const { data } = nodeInfoToShow.data;

  const renderComponent = () => {
    switch (componentType) {
      case NODE:
        return (
          <NodeInfoComponent
            data={nodeInfoToShow.data}
            hideNodeInfo={hideNodeInfo}/>
        );
      case API_SERVER:
        return (
          <ApiserverInfoComponent
            data={data}
            hideNodeInfo={hideNodeInfo}/>
        );
      case POD:
        return (
          <PodInfoComponent
            data={nodeInfoToShow.data}
            hideNodeInfo={hideNodeInfo}
            deleteNode={deleteNode}
            loadingScreen={loadingScreen}/>
        );
      case CONTAINER:
        return (
          <ContainerInfoComponent
            data={nodeInfoToShow.data}
            hideNodeInfo={hideNodeInfo}/>
        );
      default:
        return (
          <div className="nothing_info_component">
            This is the nothing component
            <button onClick={hideNodeInfo} type="button">Close</button>
          </div>
        );
    }
  };

  return (
    <div className="popup_info">
      <OutsideClick handleOutsideClick={hideNodeInfo}>
        <div className="popup_info_inner">
          {renderComponent()}
        </div>
      </OutsideClick>
    </div>
  );
};

export default ClusterInfoComponent;
