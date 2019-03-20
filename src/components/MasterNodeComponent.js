import React from 'react';
import { Group } from '@vx/group';


const MasterNodeComponent = ({ node, top, left, showNodeInfo }) => {

  const darkBlue = '#373B44';
  const lighterBlue = '#4286f4';

  const peach = '#fd9b93';
  const pink = '#fe6e9e';
  const blue = '#03c0dc';
  const green = '#26deb0';
  const plum = '#71248e';
  const lightpurple = '#374469';
  const white = '#ffffff';
  const bg = '#272b4d';
  return (
    <Group top={top} left={left}>
      <circle
        className="node"
        r={52}
        fill="url('#lg')"
        stroke='#E2F0F2'
        filter="url(#shadow)"
        strokeWidth="0"
        onClick={() => {
          showNodeInfo(node);
          console.log('from circle', node);
        }}
      />
      <text
        dy={'.33em'}
        fontSize={16}
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

export default MasterNodeComponent;