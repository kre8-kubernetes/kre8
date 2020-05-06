import React from 'react';
import { Group } from '@vx/group';
import { Polygon } from '@vx/shape';

const MasterNodeComponent = ({
  node,
  top,
  left,
  showNodeInfo,
  toolTipOn,
  toolTipOff,
}) => {
  // const bg = '#1D2541';
  const bg = '#16273B';
  const stroke = '#4368C9';
  const strokeWidth = 1.25;
  const textFill = '#D7D7D7';
  const textDY = '.33em';
  const textFontSize = 16;
  const numberOfSides = 7;
  const rotate = -13;
  const size = 55;


  return (
    <Group top={ top } left={ left }>
      <Polygon
        className="graph_component"
        sides={ numberOfSides }
        size={ size }
        fill={ bg }
        stroke={ stroke }
        strokeWidth={ strokeWidth }
        rotate={ rotate }
        onClick={ () => {
          showNodeInfo(node);
        } }
        onMouseOver={ (e) => {
          toolTipOn(e, { title: 'API Server:', text: node.data.data.metadata.uid });
        } }
        onMouseLeave={ toolTipOff }
        onFocus={ (e) => {
          toolTipOn(e, { title: 'API Server:', text: node.data.data.metadata.uid });
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
        <tspan x="0" dy="-.2em">Kubernetes</tspan>
        <tspan x="0" dy="1.2em">API Server</tspan>
      </text>
    </Group>
  );
};

export default MasterNodeComponent;
