import React from 'react';
import { Group } from '@vx/group';

const WorkerNodeComponent = ({ node, top, left, showNodeInfo, toolTipOff, toolTipOn }) => {
  const bg = '#1D2541';
  const stroke = '#5499D9';
  const strokeWidth = 1.25;
  const textFill = '#D7D7D7';
  const textDY = '.33em';
  const textFontSize = 11;

  const width = 125;
  const height = 47;
  const centerX = -width / 2;
  const centerY = -height / 2;

  return (
    <Group top={top} left={left}>
      <rect
        className="graph_component"
        height={height}
        width={width}
        y={centerY}
        x={centerX}
        fill={bg}
        stroke={stroke}
        strokeWidth={strokeWidth}
        onClick={() => {
          showNodeInfo(node);
        }}
        onMouseOver={(e) => {
          toolTipOn(e, { title: 'AWS Worker Node:', text: node.data.metadata.name });
        }}
        onMouseLeave={toolTipOff}
        onFocus={(e) => {
          toolTipOn(e, { title: 'AWS Worker Node:', text: node.data.metadata.name });
        }}
      />

      <text
        dy={textDY}
        fontSize={textFontSize}
        fontFamily="Lato"
        textAnchor="middle"
        style={{ pointerEvents: 'none' }}
        fill={textFill}
      >
        <tspan x="0" dy="-.3em">AWS Worker Node</tspan>
        <tspan x="0" dy="1.5em">{ node.data.status.nodeInfo.systemUUID.slice(0, 8) }</tspan>
      </text>
    </Group>
  );
};

export default WorkerNodeComponent;
