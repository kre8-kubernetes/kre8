/* eslint-disable class-methods-use-this */
import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import uuid from 'uuid';
import * as events from '../../eventTypes';
import * as actions from '../store/actions/actions';
import TreeGraphComponent from '../components/GraphComponents/TreeGraphComponent';
import ClusterInfoComponent from '../components/ClusterComponentsInfoComponents/ClusterComponentInfo';

// TODO: Remove console.logs
// TODO: check out node in handleWorkerNodes method

//* --------------- STATE + ACTIONS FROM REDUX ----------------- *//
const mapStateToProps = store => ({
  showCreateMenuFormItem: store.navbar.showCreateMenuFormItem,
  menuItemToShow: store.navbar.menuItemToShow,
});

const mapDispatchToProps = dispatch => ({
  hideCreateMenuDropdown: () => {
    dispatch(actions.hideCreateMenuDropdown())
  },
  toggleCreateMenuFormItem: (bool) => {
    dispatch(actions.toggleCreateMenuFormItem(bool));
  },
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
      loadingScreen: false,
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
    this.showLoadingScreen = this.showLoadingScreen.bind(this);
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

  //* --------- TREE GRAPH GENERATION METHODS ---------------------------- **//

  //* ----------- SEND REQUESTS TO MAINTHREAD TO ASK KUBECTL FOR NODE DATA
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

  //* ----------- METHODS TO PROCESS DATA COMING BACK FROM KUBECTL VIA MAIN THREAD
  /**
   * Methods to structure tree data object starting with the Master Node (Kubernetes API Server)
   * at the top of the heirarchy. The subsequent children are then pushed into an array, Children
   * Currently the heirarchy is: MasterNode => WorkerNode => Pod => Container
   * @param {Object} data coming back from kubectl regarding the master node
  */

  handleMasterNode(event, data) {
    console.log('handleMasterNode data: ', data);
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
    console.log('handleWorkerNodes data: ', data);
    this.setState((prevState) => {
      const newState = { ...prevState, treeData: { ...prevState.treeData } };
      data.items.forEach((node) => {
        const newNode = Object.assign({}, node);
        newNode.name = node.metadata.name;
        newNode.id = node.metadata.uid;
        newNode.type = node.kind;
        newNode.children = [];
        newState.treeData.children.push(newNode);
      });
      return { ...prevState, treeData: newState.treeData };
    });
  }

  handleContainersAndPods(event, data) {
    console.log('handleContainersAndPods data: ', data);
    this.setState((prevState) => {
      const { treeData } = prevState;
      const newState = { ...prevState, treeData: { ...treeData, children: [...treeData.children] } };
      const addressMap = newState.treeData.children.reduce((acc, ele, index) => {
        acc[ele.name] = index;
        return acc;
      }, {});

      data.items.forEach((pod) => {
        const newPod = Object.assign({}, pod);
        if (newPod.status.phase !== 'Pending') {
          newPod.name = pod.metadata.name;
          newPod.id = pod.metadata.uid;
          newPod.type = pod.kind;
          newPod.children = [];
          newPod.spec.containers.forEach((container) => {
            const newContainer = Object.assign({}, container);
            newContainer.name = container.image;
            newContainer.type = 'Container';
            newPod.children.push(newContainer);
          });
          const { nodeName } = pod.spec;
          newState.treeData.children[addressMap[nodeName]].children.push(newPod);
        }
      });
      return newState;
    });
  }

  //* --------- DISPLAY OR HIDE NODE INFO WHEN USER HOVERS OR CLICKS IN GRAPH
  showNodeInfo(node) {
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

  //* --------- DELETE NODE METHOD
  // Send the DELETE_DEPLOYMENT event to the main process to trigger the kubectl delete command
  deleteNode() {
    const { nodeInfoToShow } = this.state;
    this.showLoadingScreen();
    ipcRenderer.send(events.DELETE_DEPLOYMENT, nodeInfoToShow);
  }

  //* --------- RERENDER GRAPH METHOD
  /**
   * Call to get data on the current nodes -- this will update state and trigger
   * a re-render of the page, either removing the deleted node, or adding the newly created node
  */
  handleRerenderNode() {
    const { hideCreateMenuDropdown, toggleCreateMenuFormItem } = this.props;
    console.log('handle rerender node called');
    //ipcRenderer.send(events.START_LOADING_ICON, 'close');
    console.log('hit start loading icon inside handle render node handler');
    hideCreateMenuDropdown();
    this.getMasterNode();
    this.getWorkerNodes();
    this.getContainersAndPods();
    toggleCreateMenuFormItem();
    this.hideNodeInfo();
    this.showLoadingScreen();
  }

  //* --------- DISPLAY OR CLOSE LOADING SCREEN
  /**
   * Triggered when delete node called, and closed when delete node completes
   * when handleRerenderNode activated. Displays loading icon above graph.
  */
  showLoadingScreen() {
    const { loadingScreen } = this.state;
    if (!loadingScreen) {
      this.setState(prevState => ({ ...prevState, loadingScreen: true }));
    } else {
      this.setState(prevState => ({ ...prevState, loadingScreen: false }));
    }
  }

  //* --------- RENDER METHOD
  render() {
    // const dummyTreeData = {
    //   name: 'Master Node',
    //   id: uuid(),
    //   type: 'apiserver',
    //   children: [
    //     {
    //       name: 'Worker Node #1',
    //       id: uuid(),
    //       worder_node_id: 0,
    //       type: 'Node',
    //       children: [
    //         {
    //           name: '#1',
    //           id: uuid(),
    //           pod_id: 0,
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //         {
    //           name: '#2',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //         {
    //           name: '#3',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //         {
    //           name: '#3',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //         {
    //           name: '#3',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //         { 
    //           name: '#3',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //       ]
    //     },
    //     {
    //       name: 'Worker Node #2',
    //       id: uuid(),
    //       worder_node_id: 1,
    //       type: 'Node',
    //       children: [
    //         { 
    //           name: '#1',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //         { 
    //           name: '#2',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //         { 
    //           name: '#3',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //         { 
    //           name: '#3',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //         { 
    //           name: '#3',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //         { 
    //           name: '#3',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //       ],
    //     },
    //     {
    //       name: 'Worker Node #3',
    //       id: uuid(),
    //       worder_node_id: 2,
    //       type: 'Node',
    //       children: [
    //         {
    //           name: '#1',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //         {
    //           name: '#2',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //         {
    //           name: '#3',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //         {
    //           name: '#3',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //         {
    //           name: '#3',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //         {
    //           name: '#3',
    //           id: uuid(),
    //           type: 'Pod',
    //           children: [{
    //             name: '',
    //             id: uuid(),
    //             type: 'Container',
    //           }],
    //         },
    //       ],
    //     },
    //     // {
    //     //   name: 'Worker Node #4',
    //     //   id: uuid(),
    //     //   worder_node_id: 3,
    //     //   type: 'Node',
    //     //   children: [
    //     //     {
    //     //       name: '#1',
    //     //       id: uuid(),
    //     //       type: 'Pod',
    //     //       children: [{
    //     //         name: '',
    //     //         id: uuid(),
    //     //         type: 'Container',
    //     //       }]
    //     //     },
    //     //     {
    //     //       name: '#2',
    //     //       id: uuid(),
    //     //       type: 'Pod',
    //     //       children: [{
    //     //         name: '',
    //     //         id: uuid(),
    //     //         type: 'Container',
    //     //       }]
    //     //     },
    //     //     {
    //     //       name: '#3',
    //     //       id: uuid(),
    //     //       type: 'Pod',
    //     //       children: [{
    //     //         name: '',
    //     //         id: uuid(),
    //     //         type: 'Container',
    //     //       }]
    //     //     },
    //     //     {
    //     //       name: '#3',
    //     //       id: uuid(),
    //     //       type: 'Pod',
    //     //       children: [{
    //     //         name: '',
    //     //         id: uuid(),
    //     //         type: 'Container',
    //     //       }]
    //     //     },
    //     //     {
    //     //       name: '#3',
    //     //       id: uuid(),
    //     //       type: 'Pod',
    //     //       children: [{
    //     //         name: '',
    //     //         id: uuid(),
    //     //         type: 'Container',
    //     //       }]
    //     //     },
    //     //     {
    //     //       name: '#3',
    //     //       id: uuid(),
    //     //       type: 'Pod',
    //     //       children: [{
    //     //         name: '',
    //     //         id: uuid(),
    //     //         type: 'Container',
    //     //       }]
    //     //     },
    //     //   ]
    //     // },
    //     // {
    //     //   name: 'kube-apiserver',
    //     //   id: uuid(),
    //     //   type: 'master-component',
    //     // },
    //     // {
    //     //   name: 'etcd',
    //     //   id: uuid(),
    //     //   type: 'master-component',
    //     // },
    //     // {
    //     //   name: 'kube-scheduler',
    //     //   id: uuid(),
    //     //   type': 'master-component',
    //     // },
    //     // {
    //     //   name: 'kube-controller-manager',
    //     //   type': 'master-component',
    //     // },
    //   ],
    // };

    const margin = {
      top: 110,
      left: 30,
      right: 30,
      bottom: 110,
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
      loadingScreen,
    } = this.state;

    //* --------- RETURN
    return (
      <div className="treegraph_container">
        {showInfo === true && (
          <ClusterInfoComponent
            nodeInfoToShow={nodeInfoToShow}
            hideNodeInfo={this.hideNodeInfo}
            deleteNode={this.deleteNode}
            loadingScreen={loadingScreen}
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
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TreeGraphContainer));
