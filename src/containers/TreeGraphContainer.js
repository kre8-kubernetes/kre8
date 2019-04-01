/* eslint-disable class-methods-use-this */
import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
// import { Group } from '@vx/group';
// import { Tree } from '@vx/hierarchy';
// import { LinkHorizontal } from '@vx/shape';
// import { hierarchy } from 'd3-hierarchy';
// import { LinearGradient } from '@vx/gradient';
import uuid from 'uuid';
import * as events from '../../eventTypes';
import TreeGraphComponent from '../components/GraphComponents/TreeGraphComponent';
import ClusterInfoComponent from '../components/GraphComponents/ClusterComponentInfo';

// TODO: Remove console.logs
// TODO: check out node in handleWorkerNodes method

//* --------------- STATE + ACTIONS FROM REDUX ----------------- *//
const mapStateToProps = store => ({
  showCreateMenuItem: store.navbar.showCreateMenuItem,
  menuItemToShow: store.navbar.menuItemToShow,
});

//* -------------- TREE GRAPH CONTAINER COMPONENT ----------------------------------- *//
class TreeGraphContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showInfo: false,
      nodeInfoToShow: {},
      masterNodeData: {},
      treeData: {},
      dimensions: {
        width: 0,
        height: 0,
      },
      mouseCoords: { top: 0, left: 0 },
      showToolTip: false,
      toolTipTitle: '',
      toolTipText: '',
    };

    this.showNodeInfo = this.showNodeInfo.bind(this);
    this.hideNodeInfo = this.hideNodeInfo.bind(this);
    this.handleMasterNode = this.handleMasterNode.bind(this);
    this.handleWorkerNodes = this.handleWorkerNodes.bind(this);
    this.handleContainersAndPods = this.handleContainersAndPods.bind(this);
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    this.toolTipOn = this.toolTipOn.bind(this);
    this.toolTipOff = this.toolTipOff.bind(this);
    this.deleteNode = this.deleteNode.bind(this);
    this.handleRerenderNode = this.handleRerenderNode.bind(this);
  }

  //* -------------- COMPONENT LIFECYCLE METHODS
  componentDidMount() {
    // on mount, get the master node, get the worker nodes
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
    ipcRenderer.on(events.HANDLE_MASTER_NODE, this.handleMasterNode);
    ipcRenderer.on(events.HANDLE_WORKER_NODES, this.handleWorkerNodes);
    ipcRenderer.on(events.HANDLE_CONTAINERS_AND_PODS, this.handleContainersAndPods);
    ipcRenderer.on(events.HANDLE_RERENDER_NODE, this.handleRerenderNode);
    this.getMasterNode();
    this.getWorkerNodes();
    this.getContainersAndPods();
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(events.HANDLE_MASTER_NODE, this.handleMasterNode);
    ipcRenderer.removeListener(events.HANDLE_WORKER_NODES, this.handleWorkerNodes);
    ipcRenderer.removeListener(events.HANDLE_CONTAINERS_AND_PODS, this.handleContainersAndPods);
    ipcRenderer.removeListener(events.HANDLE_RERENDER_NODE, this.handleRerenderNode);
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  //* -------------- COMPONENT METHODS
  getMasterNode() {
    ipcRenderer.send(events.GET_MASTER_NODE, 'Master Node info request');
  }

  getWorkerNodes() {
    ipcRenderer.send(events.GET_WORKER_NODES, 'Worker Nodes info request');
  }

  getContainersAndPods() {
    ipcRenderer.send(events.GET_CONTAINERS_AND_PODS, 'Containers info request');
  }

  updateWindowDimensions() {
    this.setState(prevState => ({
      ...prevState,
      dimensions: { width: window.innerWidth, height: window.innerHeight },
    }));
  }

  //* --------- GENERATES PARAMETER FOR CREATING IAM ROLE--------------- **//
  /**
   * Methods to structure tree data object starting with the Master Node (Kubernetes API Server)
   * at the top of the heirarchy. The subsequent children are then pushed into an array, Children
   * Currently the heirarchy is: MasterNode => WorkerNode => Pod => Container
   * @param {Object} data coming back from kubectl regarding the master node
  */

  handleMasterNode(event, data) {
    const treeData = {
      name: data.metadata.labels.component,
      id: data.metadata.uid,
      type: data.metadata.labels.component,
      data,
      children: [],
    };
    this.setState(prevState => ({ ...prevState, treeData }));
  }

  handleWorkerNodes(event, data) {
    const { treeData } = this.state;
    const newState = { ...this.state, treeData: { ...treeData } };

    data.items.forEach((node) => {
      node.name = node.metadata.name;
      node.id = node.metadata.uid;
      node.type = node.kind;
      node.children = [];
      newState.treeData.children.push(node);
    });
    this.setState(prevState => ({ ...prevState, treeData: newState.treeData }));
  }

  handleContainersAndPods(event, data) {
    const { treeData } = this.state;

    const newState = { ...this.state, treeData: { ...treeData, children: [...treeData.children] } };
    const addressMap = newState.treeData.children.reduce((acc, ele, index) => {
      acc[ele.name] = index;
      return acc;
    }, {});

    data.items.forEach((pod) => {
      if (pod.status.phase !== 'Pending') {
        pod.name = pod.metadata.name;
        pod.id = pod.metadata.uid;
        pod.type = pod.kind;
        pod.children = [];
        pod.spec.containers.forEach((container) => {
          container.name = container.image;
          container.type = 'Container';
          pod.children.push(container);
        });
        const nodeName = pod.spec.nodeName;
        newState.treeData.children[addressMap[nodeName]].children.push(pod);
      }
    });
    this.setState(newState);
  }

  showNodeInfo(node) {
    console.log('node coming in', node);
    this.setState(prevState => ({ ...prevState, showInfo: true, nodeInfoToShow: node }));
  }

  hideNodeInfo() {
    this.setState(prevState => ({ ...prevState, showInfo: false }));
  }

  toolTipOn(e, data) {
    const newCoords = { top: e.clientY - 75, left: e.clientX - 50 };
    this.setState(prevState => ({
      ...prevState,
      mouseCoords: newCoords,
      showToolTip: true,
      toolTipTitle: data.title,
      toolTipText: data.text,
    }));
  }

  toolTipOff(e) {
    this.setState(prevState => ({ ...prevState, showToolTip: false }));
  }

  // Send the DELETE_NODE event to the main process to trigger the kubectl delete command
  deleteNode() {
    const { nodeInfoToShow } = this.state;
    ipcRenderer.send(events.DELETE_NODE, nodeInfoToShow);
  }

  /**
   * Call to get data on the current nodes -- this will update state and trigger
   * a re-render of the page, either removing the deleted node, or adding the newly created node
  */
  handleRerenderNode() {
    console.log('handle rerender node called');
    ipcRenderer.send(events.START_LOADING_ICON, 'close');
    console.log('hit start loading icon inside handle render node handler');
    this.getMasterNode();
    this.getWorkerNodes();
    this.getContainersAndPods();
  }

  render() {
    const dummyTreeData = {
      name: 'Master Node',
      id: uuid(),
      type: 'apiserver',
      children: [
        {
          name: 'Worker Node #1',
          id: uuid(),
          worder_node_id: 0,
          type: 'Node',
          children: [
            {
              name: '#1',
              id: uuid(),
              pod_id: 0,
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
            {
              name: '#2',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
            {
              name: '#3',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
            {
              name: '#3',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
            {
              name: '#3',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
            { 
              name: '#3',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
          ]
        },
        {
          name: 'Worker Node #2',
          id: uuid(),
          worder_node_id: 1,
          type: 'Node',
          children: [
            { 
              name: '#1',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
            { 
              name: '#2',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
            { 
              name: '#3',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
            { 
              name: '#3',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
            { 
              name: '#3',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
            { 
              name: '#3',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
          ],
        },
        {
          name: 'Worker Node #3',
          id: uuid(),
          worder_node_id: 2,
          type: 'Node',
          children: [
            {
              name: '#1',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
            {
              name: '#2',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
            {
              name: '#3',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
            {
              name: '#3',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
            {
              name: '#3',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
            {
              name: '#3',
              id: uuid(),
              type: 'Pod',
              children: [{
                name: '',
                id: uuid(),
                type: 'Container',
              }],
            },
          ],
        },
        // {
        //   name: 'Worker Node #4',
        //   id: uuid(),
        //   worder_node_id: 3,
        //   type: 'Node',
        //   children: [
        //     {
        //       name: '#1',
        //       id: uuid(),
        //       type: 'Pod',
        //       children: [{
        //         name: '',
        //         id: uuid(),
        //         type: 'Container',
        //       }]
        //     },
        //     {
        //       name: '#2',
        //       id: uuid(),
        //       type: 'Pod',
        //       children: [{
        //         name: '',
        //         id: uuid(),
        //         type: 'Container',
        //       }]
        //     },
        //     {
        //       name: '#3',
        //       id: uuid(),
        //       type: 'Pod',
        //       children: [{
        //         name: '',
        //         id: uuid(),
        //         type: 'Container',
        //       }]
        //     },
        //     {
        //       name: '#3',
        //       id: uuid(),
        //       type: 'Pod',
        //       children: [{
        //         name: '',
        //         id: uuid(),
        //         type: 'Container',
        //       }]
        //     },
        //     {
        //       name: '#3',
        //       id: uuid(),
        //       type: 'Pod',
        //       children: [{
        //         name: '',
        //         id: uuid(),
        //         type: 'Container',
        //       }]
        //     },
        //     {
        //       name: '#3',
        //       id: uuid(),
        //       type: 'Pod',
        //       children: [{
        //         name: '',
        //         id: uuid(),
        //         type: 'Container',
        //       }]
        //     },
        //   ]
        // },
        // {
        //   name: 'kube-apiserver',
        //   id: uuid(),
        //   type: 'master-component',
        // },
        // {
        //   name: 'etcd',
        //   id: uuid(),
        //   type: 'master-component',
        // },
        // {
        //   name: 'kube-scheduler',
        //   id: uuid(),
        //   type': 'master-component',
        // },
        // {
        //   name: 'kube-controller-manager',
          
        //   type': 'master-component',
        // },
      ],
    };

    const margin = {
      top: 110,
      left: 30,
      right: 30,
      bottom: 110
    };

    const {
      showInfo,
      nodeInfoToShow,
      showToolTip,
      mouseCoords,
      toolTipTitle,
      toolTipText,
      dimensions,
      treeData,
    } = this.state;
    return (
      <div className="treegraph_container">
        {showInfo === true && (
          <ClusterInfoComponent
            nodeInfoToShow={nodeInfoToShow}
            hideNodeInfo={this.hideNodeInfo}
            deleteNode={this.deleteNode}
          />
        )}
        {showToolTip === true && (
          <div className="toolTip" style={mouseCoords}>
            <h4>{toolTipTitle}</h4>
            <p>{toolTipText}</p>
          </div>
        )}
        <TreeGraphComponent
          showNodeInfo={this.showNodeInfo}
          toolTipOn={this.toolTipOn}
          toolTipOff={this.toolTipOff}
          width={dimensions.width}
          height={dimensions.height}
          treeData={treeData}
          margin={margin}
        />
      </div>
    )
  }
}

export default withRouter(connect(mapStateToProps, null)(TreeGraphContainer));
