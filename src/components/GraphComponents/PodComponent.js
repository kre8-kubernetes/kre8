import React from 'react';
import { Group } from '@vx/group';


// filter="url(#shadow)"
        {/* fill="url('#podGradient')" */}

const PodComponent = ({ node, top, left, showNodeInfo, toolTipOff, toolTipOn }) => {
  const peach = '#fd9b93';
  const pink = '#fe6e9e';
  const blue = '#03c0dc';
  const green = '#26deb0';
  const plum = '#71248e';
  const lightpurple = '#374469';
  const white = '#ffffff';
  // const bg = '#272b4d';


  const bg= '#1D2541';
  const stroke='#228EB5';
  const strokeWidth = 1;
  const height = 24;
  const width = 15;

  return (
    <Group top={top} left={left}>
      <circle className="pods"
        r={15}
        fill={bg}
        stroke={stroke}
        strokeWidth={strokeWidth}
        onClick={() => {
          showNodeInfo(node);
          console.log('from circle', node);
        }}
        onMouseOver={(e) => {
          toolTipOn(e, { title: 'ReplicaSet:', text: node.data.metadata.generateName.slice(0, -1) });
        }}
        onMouseLeave={toolTipOff}
      />
      {/* <ellipse className="pods"
        rx={width}
        ry={height}
        fill={bg}
        stroke={stroke}
        strokeWidth={strokeWidth}
        onClick={() => {
          showNodeInfo(node);
          console.log('from circle', node);
        }}
      /> */}
      <text className="podText"
        dy={'.33em'}
        fontSize={11}
        fontFamily="Lato"
        textAnchor={'middle'}
        style={{ pointerEvents: 'none' }}
        fill={'#D7D7D7'}
      >
        {`#1`}
      </text>
    </Group>
  );
}

export default PodComponent;