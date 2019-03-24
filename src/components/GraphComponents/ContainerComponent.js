import React from 'react';
import { Group } from '@vx/group';

// filter="url(#shadow)"


const PodComponent = ({ node, top, left, showNodeInfo, toolTipOff, toolTipOn }) => {
  const peach = '#fd9b93';
  const pink = '#fe6e9e';
  const blue = '#03c0dc';
  const green = '#26deb0';
  const plum = '#71248e';
  const lightpurple = '#374469';
  const white = '#ffffff';
  const citrus = '#ddf163';
  const lightBlue = '#CDEDF0';
  

  const bg = '#1D2541';
  const stroke = '#82EFFF';
  const strokeWidth = .65;
  // const radius = 13;
  const height = 18;
  const width = 12;
  
  return (
    <Group top={top} left={left}>
    <ellipse 
        className="graph_component"
        rx={width}
        ry={height}
        fill={bg}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray="6,1.26" d="M5 40 l215 0"
        onClick={() => {
          showNodeInfo(node);
          console.log('from circle', node);
        }}
        onMouseOver={(e) => {
          toolTipOn(e, {title: 'Image Name:', text: node.data.image});
        }}
        onMouseLeave={toolTipOff}
      />
      {/* <circle
        r={radius}
        fill={bg}
        stroke={stroke}
        strokeWidth={strokeWidth}
        onClick={() => {
          showNodeInfo(node);
          console.log('from circle', node);
        }}
      /> */}
      <text
        dy={'.33em'}
        fontSize={9}
        fontFamily="Lato"
        textAnchor={'middle'}
        style={{ pointerEvents: 'none' }}
        fill={'#D7D7D7'}
      >
        {`#2`}
      </text>
    </Group>
  );
}

export default PodComponent;