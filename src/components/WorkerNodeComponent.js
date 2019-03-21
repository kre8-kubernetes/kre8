import React from 'react';
import { Group } from '@vx/group';

// filter="url(#shadow)"
//fill="url('#workerNodeGradient')" 




const WorkerNodeComponent = ({ node, top, left, showNodeInfo }) => {
  const peach = '#fd9b93';
  const pink = '#fe6e9e';
  const blue = '#03c0dc';
  const green = '#26deb0';
  const plum = '#71248e';
  const lightpurple = '#374469';
  const white = '#ffffff';
  // const bg = '#272b4d';
  const bg= '#1F2D46';
  const medBlue = '#1DBDCE';

  // const height = 75;
  // const width = 60;

  const width = 45;
  const height = 25;
  const centerX = -width / 2;
  const centerY = -height / 2;

  return (
    <Group top={top} left={left}>
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

      <rect
        height={height}
        width={width}
        y={centerY}
        x={centerX}
        fill={bg}
        stroke={medBlue}
        strokeWidth={1}
        onClick={() => {
          alert(`clicked: ${JSON.stringify(node.data.name)}`);
        }}
      />





      <text
        dy={'.33em'}
        fontSize={11}
        fontFamily="Arial"
        textAnchor={'middle'}
        style={{ pointerEvents: 'none' }}
        fill={'#D7D7D7'}
      >
        {node.data.name}
      </text>
    </Group>
  );
}

export default WorkerNodeComponent;