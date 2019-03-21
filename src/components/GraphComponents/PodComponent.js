import React from 'react';
import { Group } from '@vx/group';


// filter="url(#shadow)"
        {/* fill="url('#podGradient')" */}

const PodComponent = ({ node, top, left, showNodeInfo }) => {
  const peach = '#fd9b93';
  const pink = '#fe6e9e';
  const blue = '#03c0dc';
  const green = '#26deb0';
  const plum = '#71248e';
  const lightpurple = '#374469';
  const white = '#ffffff';
  // const bg = '#272b4d';
  const bg= '#243B55';

  const height = 75;
  const width = 60;
  return (
    <Group top={top} left={left}>
      <circle className="pods"
        r={25}
        fill={bg}
        stroke={green}
        strokeWidth="0"
        onClick={() => {
          showNodeInfo(node);
          console.log('from circle', node);
        }}
      />
      <text className="podText"
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