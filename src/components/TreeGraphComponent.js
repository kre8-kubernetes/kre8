import React from 'react';
import { Group } from '@vx/group';
import { Tree } from '@vx/hierarchy';
import { LinkHorizontal, LinkRadial, LinkRadialLine, LinkVertical, LinkVerticalLine, LinkVerticalCurve } from '@vx/shape';
import { hierarchy } from 'd3-hierarchy';
import { LinearGradient, RadialGradient } from '@vx/gradient';
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
  // const bg = '#272b4d';
  const bg= '#1F2D46';

 



  //masternode
  const HydrogenDark = '#667db6';
  const HydrogenLight = '#0082c8';

  // const HydrogenDark = '#021B79';
  // const HydrogenLight = '#0575E6';

  //worker node
  const darkBlue = '#373B44';
  const lighterBlue = '#4286f4';

  //podGradient
  const coolSkyDark = '#2980B9'
  const coolSkyLight = '#6DD5FA'

  //container
  const waterDark = '#B2FEFA';
  const waterLight = '#B2FEFA';

  //Blues
  const blue1 = '#C5DEEf';
  const blue2 = '#AED3EE';
  const blue3 = '#76BAEB';
  const blue4 = '#0251C0';
  const blue5 = '#023C8B';
  const blue6 = '#02326C';
  const blue7 = '#012B49';
  const blue8 = '#01253E';




  const { height, width, treeData, margin } = props;
  const innerHeight = height - margin.top - margin.bottom;
  const innerWidth = width - margin.left - margin.right;

  // {/* filter="url(#shadow)" */}
          {/* <rect width={width} height={height} rx={0} fill="url('#back')" /> */}

        {/* <filter id="shadow"><feDropShadow dx="1" dy="1" stdDeviation="1"/></filter> */}


  // const innerWidth = 2 * Math.PI;
  // const innerHeight = Math.min(yMax, xMax) / 2;

  const data = hierarchy(treeData);

  return (
    <div className='treegraph_component'>
      <svg width={width} height={height}>
        <RadialGradient id="lg" from={blue4} to={blue5} />
        <RadialGradient id="workerNodeGradient" from={blue3} to={blue4} />
        <RadialGradient id="podGradient" from={blue3} to={blue4} />
        <RadialGradient id="containerGradient" from={blue4} to={blue5} />
        <RadialGradient id="podGradient" from={blue5} to={blue6} />
        <RadialGradient id="lines" from={blue6} to={blue7} />

        <LinearGradient id="back" from={'#1F2D46'} to={'#152134'} />
          
        <Tree root={data} size={[innerWidth, innerHeight]} separation={(a, b) => (a.parent == b.parent ? 1 : 0.5) / a.depth}>

          {tree => {
            // console.log('tree', tree)
            return (
              <Group top={75} left={25}>

                {tree.links().map((link, i) => {
                  // console.log('link', link);
                  return (
                    <LinkVerticalLine
                      key={`link-${i}`}
                      data={link}
                      stroke={lightpurple}
                      //stroke="url('#lines')"
                      strokeWidth="2"
                      fill="none"
                     
                      // radius={d => d.y}

                    />
                  );
                })}
                {tree.descendants().map((node, i) => {
                  let top;
                  let left;
                  
                  // const [radialX, radialY] = pointRadial(node.x, node.y);
                  // top = radialY;
                  // left = radialX;
                  top = node.y;
                  left = node.x;
  
                  if (node.data.type === 'apiserver') 
                    return <MasterNodeComponent 
                      showNodeInfo={props.showNodeInfo} 
                      node={node} 
                      top={top} 
                      left={left} 
                      key={i}
                    />

                  if (node.data.type === 'Node') 
                    return <WorkerNodeComponent  
                      showNodeInfo={props.showNodeInfo} 
                      node={node} 
                      top={top} 
                      left={left} 
                      key={i}
                    />

                  if (node.data.type === 'Pod') 
                    return <PodComponent 
                      showNodeInfo={props.showNodeInfo} 
                      node={node} 
                      top={top} 
                      left={left} 
                      key={i} 
                    />

                  if (node.data.type === 'Container') 
                    return <ContainerComponent 
                      showNodeInfo={props.showNodeInfo} 
                      node={node} 
                      top={top} 
                      left={left}
                      key={i} 
                    />

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