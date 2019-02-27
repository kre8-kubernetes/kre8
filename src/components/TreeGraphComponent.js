import React from 'react';
import { Group } from '@vx/group';
import { Tree } from '@vx/hierarchy';
import { LinkHorizontal, LinkRadial, LinkRadialLine } from '@vx/shape';
import { hierarchy } from 'd3-hierarchy';
import { LinearGradient } from '@vx/gradient';
import { pointRadial } from 'd3-shape';

import MasterNodeComponent from './MasterNodeComponent';
import WorkerNodeComponent from './WorkerNodeComponent';
import PodComponent from './PodComponent';
import ContainerComponent from './ContainerComponent'

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

  const innerWidth = 2 * Math.PI;
  const innerHeight = Math.min(yMax, xMax) / 2;

  const data = hierarchy(treeData);

  console.log('hierarchy data from the TreeGraphComponent', data);

  return (
    <div className='treegraph_component'>
      <svg width={width} height={height}>
        <LinearGradient id="lg" from={peach} to={pink} />
        <rect width={width} height={height} rx={14} fill={'#f2fffd'} />
        <Tree root={data} size={[innerWidth, innerHeight]}>
          {tree => {
            console.log('tree', tree)
            return (
              <Group top={yMax / 2} left={xMax / 2}>
                {tree.links().map((link, i) => {
                  console.log('link', link);
                  return (
                    <LinkRadial
                      key={`link-${i}`}
                      data={link}
                      stroke={green}
                      strokeWidth="2"
                      fill="none"
                      radius={d => d.y}
                    />
                  );
                })}
                {tree.descendants().map((node, i) => {
                  let top;
                  let left;
                  
                  const [radialX, radialY] = pointRadial(node.x, node.y);
                  top = radialY;
                  left = radialX;
  
                  if (node.data.type === 'apiserver') return <MasterNodeComponent showNodeInfo={props.showNodeInfo} node={node} top={top} left={left} key={i}/>
                  if (node.data.type === 'Node') return <WorkerNodeComponent showNodeInfo={props.showNodeInfo} node={node} top={top} left={left} key={i} />
                  if (node.data.type === 'pod') return <PodComponent showNodeInfo={props.showNodeInfo} node={node} top={top} left={left} key={i} />
                  if (node.data.type === 'container') return <ContainerComponent showNodeInfo={props.showNodeInfo} node={node} top={top} left={left} key={i} />
                  // if (node.data.type === 'master-component') return <ContainerComponent node={node} top={top} left={left} key={i} />
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