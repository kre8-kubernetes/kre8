import React from 'react';
import { Group } from '@vx/group';

// filter="url(#shadow)"


const PodComponent = ({ node, top, left, showNodeInfo }) => {
  const peach = '#fd9b93';
  const pink = '#fe6e9e';
  const blue = '#03c0dc';
  const green = '#26deb0';
  const plum = '#71248e';
  const lightpurple = '#374469';
  const white = '#ffffff';
  const citrus = '#ddf163';

  const bg = '#1F2D46';
  const height = 20;
  const width = 15;
  
  return (
    <Group top={top} left={left}>
    <ellipse className="pods"
        rx={width}
        ry={height}
        fill={bg}
        stroke={citrus}
        strokeWidth="1"
        strokeDasharray="10,10" d="M5 40 l215 0"
        onClick={() => {
          showNodeInfo(node);
          console.log('from circle', node);
        }}
      />


      {/* <circle
        r={10}
        fill="bg"
        stroke="#plum"
        strokeWidth="1"
        onClick={() => {
          showNodeInfo(node);
          console.log('from circle', node);
        }}
      /> */}
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

export default PodComponent;