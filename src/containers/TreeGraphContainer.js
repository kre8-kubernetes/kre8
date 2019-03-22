import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { Switch, Route, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Group } from '@vx/group';
import { Tree } from '@vx/hierarchy';
import { LinkHorizontal } from '@vx/shape';
import { hierarchy } from 'd3-hierarchy';
import { LinearGradient } from '@vx/gradient';
import uuid from 'uuid'

import * as events from '../../eventTypes';

import TreeGraphComponent from '../components/TreeGraphComponent';
import ClusterInfoComponent from '../components/ClusterComponentInfo';
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
      nodeInfoToShow: {},
      masterNodeData: {},
      treeData: {

      },
      dimensions: {
        width: 0,
        height: 0
      }
    }
    this.showNodeInfo = this.showNodeInfo.bind(this);
    this.hideNodeInfo = this.hideNodeInfo.bind(this);
    this.handleMasterNode = this.handleMasterNode.bind(this);
    this.handleWorkerNodes = this.handleWorkerNodes.bind(this);
    this.handleContainersAndPods = this.handleContainersAndPods.bind(this);
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);

  }

  componentDidMount() {
    // on mount, get the master node, get the worker nodes
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
    console.log(window);
    ipcRenderer.on(events.HANDLE_MASTER_NODE, this.handleMasterNode);
    ipcRenderer.on(events.HANDLE_WORKER_NODES, this.handleWorkerNodes);
    ipcRenderer.on(events.HANDLE_CONTAINERS_AND_PODS, this.handleContainersAndPods);
    this.getMasterNode();
    this.getWorkerNodes();
    this.getContainersAndPods();
  };

  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_MASTER_NODE, this.handleMasterNode);
    ipcRenderer.removeListener(events.HANDLE_WORKER_NODES, this.handleWorkerNodes);
    ipcRenderer.removeListener(events.HANDLE_CONTAINERS_AND_PODS, this.handleContainersAndPods);
    window.removeEventListener('resize', this.updateWindowDimensions);
  }


  updateWindowDimensions() {
    this.setState({ dimensions: { width: window.innerWidth, height: window.innerHeight }})
  }

  getMasterNode() {
    ipcRenderer.send(events.GET_MASTER_NODE, 'hello from the getMasterNode call');
  }

  getWorkerNodes() {
    ipcRenderer.send(events.GET_WORKER_NODES, 'helle from the getWokerNodes call');
  }

  getContainersAndPods() {
    ipcRenderer.send(events.GET_CONTAINERS_AND_PODS, 'hello from the getContainers call')
  }

  handleMasterNode(event, data) {
    console.log('data coming back from master api node', data);
    const treeData = {
      "name": data.metadata.labels.component,
      "id": data.metadata.uid,
      "type": data.metadata.labels.component,
      "data": data,
      "children": []
    };
    this.setState({ ...this.state, treeData: treeData});
  }

  handleWorkerNodes(event, data) {
    console.log('data coming back from worker nodes', data);
    const newState = {...this.state, treeData: {...this.state.treeData}};
    data.items.forEach((node) => {
      node["name"] = node.metadata.name;
      node["id"] = node.metadata.uid;
      node["type"] = node.kind;
      node["children"] = [];
      newState.treeData.children.push(node);
    });
    console.log("newState: ", newState);
    this.setState({ ...this.state, treeData: newState.treeData});

  }

  handleContainersAndPods(event, data) {
    console.log('container data', data);
    debugger;
    const newState = {...this.state, treeData: {...this.state.treeData, children: [...this.state.treeData.children]}};
    const addressMap = newState.treeData.children.reduce((acc, ele, index) => {
      acc[ele.name] = index;
      return acc;
    }, {});
    data.items.forEach((pod) => {
      pod["name"] = pod.metadata.name;
      pod["id"] = pod.metadata.uid;
      pod["type"] = pod.kind;
      pod["children"] = [];
      pod.spec.containers.forEach((container) => {
        container["name"] = container.image;
        container["type"] = "Container";
        pod.children.push(container);
      });
      const nodeName = pod.spec.nodeName;
      newState.treeData.children[addressMap[nodeName]].children.push(pod);
    });
    this.setState(newState);
  }

  showNodeInfo(node) {
    console.log('node coming in', node);
    this.setState({ ...this.state, showInfo: true, nodeInfoToShow: node });
  };

  hideNodeInfo() {
    this.setState({ ...this.state, showInfo: false });
  };

  render() {
    const treeData = {
      "name": "Master Node",
      "id": uuid(),
      "type": "apiserver",
      "children": [
        {
          "name": "Worker Node #1",
          "id": uuid(),
          "worder_node_id": 0,
          "type": "Node",
          "children": [
            { 
              "name": "#1",
              "id": uuid(),
              "pod_id": 0,
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
            { 
              "name": "#2",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
            { 
              "name": "#3",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
            { 
              "name": "#3",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
            { 
              "name": "#3",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
            { 
              "name": "#3",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
          ]
        },
        {
          "name": "Worker Node #2",
          "id": uuid(),
          "worder_node_id": 1,
          "type": "Node",
          "children": [
            { 
              "name": "#1",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
            { 
              "name": "#2",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
            { 
              "name": "#3",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
            { 
              "name": "#3",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
            { 
              "name": "#3",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
            { 
              "name": "#3",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
          ]
        },
        {
          "name": "Worker Node #3",
          "id": uuid(),
          "worder_node_id": 2,
          "type": "Node",
          "children": [
            { 
              "name": "#1",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
            { 
              "name": "#2",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
            { 
              "name": "#3",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
            { 
              "name": "#3",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
            { 
              "name": "#3",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
            { 
              "name": "#3",
              "id": uuid(),
              "type": "Pod",
              "children": [{
                "name": "",
                "id": uuid(),
                "type": "Container",
              }]
            },
          ]
        },
        // {
        //   "name": "Worker Node #4",
        //   "id": uuid(),
        //   "worder_node_id": 3,
        //   "type": "Node",
        //   "children": [
        //     {
        //       "name": "#1",
        //       "id": uuid(),
        //       "type": "Pod",
        //       "children": [{
        //         "name": "",
        //         "id": uuid(),
        //         "type": "Container",
        //       }]
        //     },
        //     {
        //       "name": "#2",
        //       "id": uuid(),
        //       "type": "Pod",
        //       "children": [{
        //         "name": "",
        //         "id": uuid(),
        //         "type": "Container",
        //       }]
        //     },
        //     {
        //       "name": "#3",
        //       "id": uuid(),
        //       "type": "Pod",
        //       "children": [{
        //         "name": "",
        //         "id": uuid(),
        //         "type": "Container",
        //       }]
        //     },
        //     {
        //       "name": "#3",
        //       "id": uuid(),
        //       "type": "Pod",
        //       "children": [{
        //         "name": "",
        //         "id": uuid(),
        //         "type": "Container",
        //       }]
        //     },
        //     {
        //       "name": "#3",
        //       "id": uuid(),
        //       "type": "Pod",
        //       "children": [{
        //         "name": "",
        //         "id": uuid(),
        //         "type": "Container",
        //       }]
        //     },
        //     {
        //       "name": "#3",
        //       "id": uuid(),
        //       "type": "Pod",
        //       "children": [{
        //         "name": "",
        //         "id": uuid(),
        //         "type": "Container",
        //       }]
        //     },
        //   ]
        // },
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
      top: 150,
      left: 30,
      right: 30,
      bottom: 150
    };


          console.log("this.state: ", this.state);

    return (
      <div className='treegraph_container'>
        {this.state.showInfo === true && (
          <ClusterInfoComponent
            nodeInfoToShow={this.state.nodeInfoToShow}
            hideNodeInfo={this.hideNodeInfo}
          />
        )}
        <TreeGraphComponent
          showNodeInfo={this.showNodeInfo}
          width={this.state.dimensions.width}
          height={this.state.dimensions.height}
          treeData={treeData}
          margin={margin}
        />
      </div>
    )
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TreeGraphContainer));
