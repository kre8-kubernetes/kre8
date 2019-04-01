import React from 'react';
import uuid from 'uuid';
import { Group } from '@vx/group';
import { Tree } from '@vx/hierarchy';
import { LinkVerticalLine } from '@vx/shape';
import { hierarchy } from 'd3-hierarchy';
import MasterNodeComponent from './MasterNodeComponent';
import WorkerNodeComponent from './WorkerNodeComponent';
import PodComponent from './PodComponent';
import ContainerComponent from './ContainerComponent';

const TreeGraphComponent = (props) => {
  const {
    height,
    width,
    treeData,
    margin,
    showNodeInfo,
    toolTipOff,
    toolTipOn,
  } = props;

  const innerHeight = height - margin.top - margin.bottom;
  const innerWidth = width;
  const lightpurple = '#374469';

  let graphHeight;
  if (height > 0) {
    graphHeight = height - 44;
  } else {
    graphHeight = height;
  }

  const data = hierarchy(treeData);

  return (
    <div className="treegraph_component">
      <svg width={width} height={graphHeight}>
        <Tree
          root={data}
          size={[innerWidth, innerHeight]}
          separation={(a, b) => (a.parent === b.parent ? 1 : 0.5) / a.depth}
        >
          {(tree) => {
            return (
              <Group top={100} left={25}>
                {tree.links().map((link, i) => (
                  <LinkVerticalLine
                    key={`link-${i}`}
                    data={link}
                    stroke={lightpurple}
                    strokeWidth="2"
                    fill="none"
                  />
                ))}
                {tree.descendants().map((node, i) => {
                  const top = node.y;
                  const left = node.x;
                  if (node.data.type === 'apiserver') {
                    return (
                      <MasterNodeComponent
                        showNodeInfo={showNodeInfo}
                        toolTipOff={toolTipOff}
                        toolTipOn={toolTipOn}
                        node={node}
                        top={top}
                        left={left}
                        key={i}
                      />
                    );
                  }

                  if (node.data.type === 'Node') {
                    return (
                      <WorkerNodeComponent
                        showNodeInfo={showNodeInfo}
                        toolTipOff={toolTipOff}
                        toolTipOn={toolTipOn}
                        node={node}
                        top={top}
                        left={left}
                        key={i}
                      />
                    );
                  }

                  if (node.data.type === 'Pod') {
                    return (
                      <PodComponent
                        showNodeInfo={showNodeInfo}
                        toolTipOff={toolTipOff}
                        toolTipOn={toolTipOn}
                        node={node}
                        top={top}
                        left={left}
                        key={i}
                      />
                    );
                  }

                  if (node.data.type === 'Container') {
                    return (
                      <ContainerComponent
                        showNodeInfo={showNodeInfo}
                        toolTipOff={toolTipOff}
                        toolTipOn={toolTipOn}
                        node={node}
                        top={top}
                        left={left}
                        key={i}
                      />
                    );
                  }
                })}
              </Group>
            );
          }}
        </Tree>
      </svg>
    </div>
  );
};

export default TreeGraphComponent;
