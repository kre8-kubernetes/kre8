import React from 'react';
import { Group } from '@vx/group';

const PodComponent = ({ node, top, left, showNodeInfo, toolTipOff, toolTipOn }) => {
  const bg = '#16273B';
  const stroke = '#82EFFF';
  const strokeWidth = 0.65;
  const height = 20;
  const width = 14;
  const textFill = '#D7D7D7';
  const textDY = '.33em';
  const textFontSize = 9;

  return (
    <Group top={ top } left={ left }>
      <ellipse
        className="graph_component"
        rx={ width }
        ry={ height }
        fill={ bg }
        stroke={ stroke }
        strokeWidth={ strokeWidth }
        strokeDasharray="6,1.26"
        d="M5 40 l215 0"
        onClick={ () => {
          showNodeInfo(node);
        } }
        onMouseOver={ (e) => {
          toolTipOn(e, { title: 'Container,  Image:', text: node.data.image });
        } }
        onMouseLeave={ toolTipOff }
        onFocus={ (e) => {
          toolTipOn(e, { title: 'Container,  Image:', text: node.data.image });
        } }
      />

      <text
        dy={ textDY }
        fontSize={ textFontSize }
        fontFamily="sans-serif"
        textAnchor="middle"
        style={ { pointerEvents: 'none' } }
        fill={ textFill }
      >
        { 'C' }
      </text>
    </Group>
  );
};

export default PodComponent;