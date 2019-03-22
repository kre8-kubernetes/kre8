import React from 'react';
import { Group } from '@vx/group';

// filter="url(#shadow)"
//fill="url('#workerNodeGradient')" 




const WorkerNodeComponent = ({ node, top, left, showNodeInfo, toolTipOff, toolTipOn }) => {
  // const peach = '#fd9b93';
  // const pink = '#fe6e9e';
  // const blue = '#03c0dc';
  // const green = '#26deb0';
  // const plum = '#71248e';
  // const lightpurple = '#374469';
  // const white = '#ffffff';
  // const medBlue = '#71D7EF';
  const bg= '#1D2541';
  const stroke='#5499D9';
  const strokeWidth = 1.25;

  const width = 125;
  const height = 47;
  const centerX = -width / 2;
  const centerY = -height / 2;

  return (
    <Group top={top} left={left}>
      <rect
        height={height}
        width={width}
        y={centerY}
        x={centerX}
        fill={bg}
        stroke={stroke}
        strokeWidth={strokeWidth}
        onClick={() => {
          showNodeInfo(node);
          console.log('from circle', node);
        }}
        onMouseOver={(e) => {  
          toolTipOn(e, { title: 'WorkerNode:', text: node.data.metadata.name });
        }}
        onMouseLeave={toolTipOff}
      />

      <text
        dy={'.33em'}
        fontSize={11}
        fontFamily="Lato"
        textAnchor={'middle'}
        style={{ pointerEvents: 'none' }}
        fill={'#D7D7D7'}
      >
      <tspan x="0" dy="-.3em">AWS Worker Node</tspan>
      <tspan x="0" dy="1.5em">{ node.data.status.nodeInfo.systemUUID.slice(0, 8) }</tspan>
      </text>
    </Group>
  );
}

export default WorkerNodeComponent;



      {/* <circle
        r={25}
        fill={bg}
        stroke={blue}
        strokeWidth="1"
        onClick={() => {
          showNodeInfo(node);
          console.log('from circle', node);
        }}
      /> */}
