import React, { Component } from 'react';
import { Switch, Route, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Group } from '@vx/group';
import { Tree } from '@vx/hierarchy';
import { LinkHorizontal } from '@vx/shape';
import { hierarchy } from 'd3-hierarchy';
import { LinearGradient } from '@vx/gradient';
import uuid from 'uuid'

import TreeGraphComponent from '../components/TreeGraphComponent';
import NodeInfoComponent from '../components/NodeInfoComponent';
import CreateMenuItemComponent from '../components/CreateMenuItemComponent';

const mapStateToProps = store => ({
  showCreateMenuItem: store.navbar.showCreateMenuItem,
  menuItemToShow: store.navbar.menuItemToShow,
});

const mapDispatchToProps = dispatch => ({
});

class TreeGraphContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showInfo: false,
      nodeInfoToShow: {}
    }
    this.showNodeInfo = this.showNodeInfo.bind(this);
    this.hideNodeInfo = this.hideNodeInfo.bind(this);
  }

  showNodeInfo(node) {
    this.setState({ ...this.state, showInfo: true, nodeInfoToShow: node });
  }

  hideNodeInfo() {
    this.setState({ ...this.state, showInfo: false });
  }

  render() {
    const treeData = {
      "name": "Master Node",
      "id": uuid(),
      "type": "master",
      "children": [
        {
          "name": "Worker Node #1",
          "id": uuid(),
          "worder_node_id": 0,
          "type": "node",
          "children": [
            { 
              "name": "Dream POD #1",
              "id": uuid(),
              "pod_id": 0,
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "id": uuid(),
                "type": "container",
              }]
            },
            { 
              "name": "Dream POD #2",
              "id": uuid(),
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "id": uuid(),
                "type": "container",
              }]
            },
            { 
              "name": "Dream POD #3",
              "id": uuid(),
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "id": uuid(),
                "type": "container",
              }]
            },
          ]
        },
        {
          "name": "Worker Node #2",
          "id": uuid(),
          "worder_node_id": 1,
          "type": "node",
          "children": [
            { 
              "name": "Dream POD #1",
              "id": uuid(),
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "id": uuid(),
                "type": "container",
              }]
            },
            { 
              "name": "Dream POD #2",
              "id": uuid(),
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "id": uuid(),
                "type": "container",
              }]
            },
            { 
              "name": "Dream POD #3",
              "id": uuid(),
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "id": uuid(),
                "type": "container",
              }]
            },
          ]
        },
        {
          "name": "Worker Node #3",
          "id": uuid(),
          "worder_node_id": 2,
          "type": "node",
          "children": [
            { 
              "name": "Dream POD #1",
              "id": uuid(),
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "id": uuid(),
                "type": "container",
              }]
            },
            { 
              "name": "Dream POD #2",
              "id": uuid(),
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "id": uuid(),
                "type": "container",
              }]
            },
            { 
              "name": "Dream POD #3",
              "id": uuid(),
              "type": "pod",
              "children": [{
                "name": "Dream POD Container",
                "id": uuid(),
                "type": "container",
              }]
            },
          ]
        },
        // {
        //   "name": "kube-apiserver",
        //   "id": uuid(),
        //   "type": "master-component",
        // },
        // {
        //   "name": "etcd",
        //   "id": uuid(),
        //   "type": "master-component",
        // },
        // {
        //   "name": "kube-scheduler",
        //   "id": uuid(),
        //   "type": "master-component",
        // },
        // {
        //   "name": "kube-controller-manager",
          
        //   "type": "master-component",
        // },
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
        {this.state.showInfo === true && (
          <NodeInfoComponent
            nodeInfoToShow={this.state.nodeInfoToShow}
            hideNodeInfo={this.hideNodeInfo}
          />
        )}
        <TreeGraphComponent
          showNodeInfo={this.showNodeInfo}
          width={1100}
          height={800}
          treeData={treeData}
          margin={margin}
        />
      </div>
    )
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TreeGraphContainer));
