import React from 'react';
import { Group } from '@vx/group';

const PodComponent = ({ node, top, left, showNodeInfo, toolTipOff, toolTipOn }) => {
  const bg = '#1D2541';
  const stroke = '#228EB5';
  const strokeWidth = 1;
  const textFill = '#D7D7D7';
  const textDY = '.33em';
  const textFontSize = 11;
  const height = 27;
  const width = 20;

  return (
    <Group top={top} left={left}>
      <ellipse
        className="pods"
        rx={width}
        ry={height}
        fill={bg}
        stroke={stroke}
        strokeWidth={strokeWidth}
        onClick={() => {
          showNodeInfo(node);
        }}
        onMouseOver={(e) => {
          toolTipOn(e, { title: 'Pod,  Replica  Set:', text: node.data.metadata.generateName.slice(0, -1) });
        }}
        onMouseLeave={toolTipOff}
        onFocus={(e) => {
          toolTipOn(e, { title: 'Pod,  Replica  Set:', text: node.data.metadata.generateName.slice(0, -1) });
        }}
      />
      <text
        className="podText"
        dy={textDY}
        fontSize={textFontSize}
        fontFamily="Lato"
        textAnchor="middle"
        style={{ pointerEvents: 'none' }}
        fill={textFill}
      >
        {'Pod'}
      </text>
    </Group>
  );
};

export default PodComponent;
