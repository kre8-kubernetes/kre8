import React from 'react';
import { Group } from '@vx/group';
import { Tree } from '@vx/hierarchy';
import { LinkHorizontal, LinkRadial } from '@vx/shape';
import { hierarchy } from 'd3-hierarchy';
import { LinearGradient } from '@vx/gradient';

import NodeComponent from './NodeComponent';

const TreeGraphComponent = (props) => {
  const peach = '#fd9b93';
  const pink = '#fe6e9e';
  const blue = '#03c0dc';
  const green = '#26deb0';
  const plum = '#71248e';
  const lightpurple = '#374469';
  const white = '#ffffff';
  const bg = '#272b4d';

  const { height, width, treeData, margin } = props;
  const yMax = height - margin.top - margin.bottom;
  const xMax = width - margin.left - margin.right;

  const data = hierarchy(treeData);

  console.log(data);

  return (
    <div className='treegraph_component'>
      <svg width={width} height={height}>
        <LinearGradient id="lg" from={peach} to={pink} />
        <rect width={width} height={height} rx={14} fill={bg} />
        <Tree root={data} size={[yMax, xMax]}>
          {tree => {
            console.log('tree', tree)
            return (
              <Group top={yMax / 2} left={xMax / 2}>
                {tree.links().map((link, i) => {
                  return (
                    <LinkRadial
                      key={`link-${i}`}
                      data={link}
                      stroke={green}
                      strokeWidth="2"
                      fill="none"
                    />
                  );
                })}
                {tree.descendants().map((node, i) => {
                  return (
                    <NodeComponent 
                      key={`node-${i}`} 
                      node={node} 
                    />
                  )
                })}
              </Group>
            );
          }}
        </Tree>


        
      </svg>
    </div>
  )
}

export default TreeGraphComponent;