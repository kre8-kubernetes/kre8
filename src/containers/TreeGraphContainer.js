import React, { Component } from 'react';
import { Switch, Route, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Group } from '@vx/group';
import { Tree } from '@vx/hierarchy';
import { LinkHorizontal } from '@vx/shape';
import { hierarchy } from 'd3-hierarchy';
import { LinearGradient } from '@vx/gradient';

import TreeGraphComponent from '../components/TreeGraphComponent';

class TreeGraphContainer extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const treeData = {
      "name": "Master Node",
      "type": "master",
      "children": [
        {
          "name": "Worker Node #1",
          "type": "node",
          "children": [
            { 
              "name": "Dream POD #1",
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "type": "container",
              }]
            },
            { 
              "name": "Dream POD #2",
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "type": "container",
              }]
            },
            { 
              "name": "Dream POD #3",
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "type": "container",
              }]
            },
          ]
        },
        {
          "name": "Worker Node #2",
          "type": "node",
          "children": [
            { 
              "name": "Dream POD #1",
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "type": "container",
              }]
            },
            { 
              "name": "Dream POD #2",
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "type": "container",
              }]
            },
            { 
              "name": "Dream POD #3",
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "type": "container",
              }]
            },
          ]
        },
        {
          "name": "Worker Node #3",
          "type": "node",
          "children": [
            { 
              "name": "Dream POD #1",
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "type": "container",
              }]
            },
            { 
              "name": "Dream POD #2",
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "type": "container",
              }]
            },
            { 
              "name": "Dream POD #3",
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "type": "container",
              }]
            },
          ]
        },
        {
          "name": "kube-apiserver",
          "type": "master-component",
        },
        {
          "name": "etcd",
          "type": "master-component",
        },
        {
          "name": "kube-scheduler",
          "type": "master-component",
        },
        {
          "name": "kube-controller-manager",
          "type": "master-component",
        },
      ],
    };

    const margin = {
      top: 10,
      left: 30,
      right: 40,
      bottom: 80
    };

    return (
      <div className='treegraph_container'>
        <TreeGraphComponent
          width={1100}
          height={800}
          treeData={treeData}
          margin={margin}
        />
      </div>
    )
  }
}

export default withRouter(connect(null, null)(TreeGraphContainer));
