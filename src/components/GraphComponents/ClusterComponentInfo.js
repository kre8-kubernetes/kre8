import React from 'react';
import ApiserverInfoComponent from '../ClusterComponentsInfoComponents/ApiserverInfoComponent';
import NodeInfoComponent from '../ClusterComponentsInfoComponents/NodeInfoComponent';
import PodInfoComponent from '../ClusterComponentsInfoComponents/PodInfoComponent';
import ContainerInfoComponent from '../ClusterComponentsInfoComponents/ContainerInfoComponent';

// TODO: Braden, doesn't like nested ifs, also what is: nothing_info_component (line 55)

const ClusterInfoComponent = (props) => {
  const {
    hideNodeInfo,
    deleteNode,
    nodeInfoToShow,
  } = props;

  const componentType = nodeInfoToShow.data.type;
  const { data } = nodeInfoToShow.data;

  return (
    <div className="popup_info">
      <div className="popup_info_inner">
        {
            (componentType === 'Node')
              ? (
                <NodeInfoComponent
                  data={nodeInfoToShow.data}
                  hideNodeInfo={hideNodeInfo}
                />
              )
              : (componentType === 'apiserver')
                ? (
                  <ApiserverInfoComponent
                    data={data}
                    hideNodeInfo={hideNodeInfo}
                  />
                )
                : (componentType === 'Pod')
                  ? (
                    <PodInfoComponent
                      data={nodeInfoToShow.data}
                      hideNodeInfo={hideNodeInfo}
                      deleteNode={deleteNode}
                    />
                  )
                  : (componentType === 'Container')
                    ? (
                      <ContainerInfoComponent
                        data={nodeInfoToShow.data}
                        hideNodeInfo={hideNodeInfo}
                      />
                    )
                    : (
                      <div className="nothing_info_component">
                        This is the nothing component
                        <button onClick={hideNodeInfo} type="button">Close</button>
                      </div>
                    )
        }
      </div>
    </div>
  );
};

export default ClusterInfoComponent;
