import React from 'react';
import { Group } from '@vx/group';
import { Tree } from '@vx/hierarchy';
import { LinkHorizontal, LinkRadial } from '@vx/shape';
import { hierarchy } from 'd3-hierarchy';
import { LinearGradient } from '@vx/gradient';
import { pointRadial } from 'd3-shape';

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

  const innerWidth = 2 * Math.PI;
  const innerHeight = Math.min(yMax, xMax) / 2;

  const data = hierarchy(treeData);

  console.log(data);

  return (
    <div className='treegraph_component'>
      <svg width={width} height={height}>
        <LinearGradient id="lg" from={peach} to={pink} />
        <rect width={width} height={height} rx={14} fill={bg} />
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
                  console.log('here are the tree descendant nodes:', node);
                  const width = 40;
                  const height = 20;

                  let top;
                  let left;
  
                  const [radialX, radialY] = pointRadial(node.x, node.y);
                  top = radialY;
                  left = radialX;
                  return (
                    <Group top={top} left={left} key={i}>
                      {node.data.type === 'master' && (
                        <circle
                          r={30}
                          fill="url('#lg')"
                          onClick={() => {
                            node.data.isExpanded = !node.data.isExpanded;
                            console.log('from circle', node);
                            // this.forceUpdate();
                          }}
                        />
                      )}
                      {node.data.type === 'node' && (
                        <rect
                          height={height}
                          width={width}
                          y={-height / 2}
                          x={-width / 2}
                          fill={'#272b4d'}
                          stroke={'#03c0dc'}
                          strokeWidth={1}
                          strokeOpacity={!node.data.children ? 0.6 : 1}
                          rx={!node.data.children ? 10 : 0}
                          onClick={() => {
                            node.data.isExpanded = !node.data.isExpanded;
                            console.log('from rect', node);
                            // this.forceUpdate();
                          }}
                        />
                      )}
                      {node.data.type === 'pod' && (
                        <circle
                          r={12}
                          fill={lightpurple}
                          onClick={() => {
                            node.data.isExpanded = !node.data.isExpanded;
                            console.log('from pod', node);
                            // this.forceUpdate();
                          }}
                        />
                      )}
                      {node.data.type === 'container' && (
                        <circle
                          r={12}
                          fill={plum}
                          onClick={() => {
                            node.data.isExpanded = !node.data.isExpanded;
                            console.log('from pod', node);
                            // this.forceUpdate();
                          }}
                        />
                      )}
                      {node.data.type === 'master-component' && (
                        <circle
                          r={12}
                          fill={white}
                          onClick={() => {
                            node.data.isExpanded = !node.data.isExpanded;
                            console.log('from pod', node);
                            // this.forceUpdate();
                          }}
                        />
                      )}
                      <text
                        dy={'.33em'}
                        fontSize={9}
                        fontFamily="Arial"
                        textAnchor={'middle'}
                        style={{ pointerEvents: 'none' }}
                        fill={node.depth === 0 ? '#71248e' : node.children ? 'white' : '#26deb0'}
                      >
                        {node.data.name}
                      </text>
                    </Group>
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