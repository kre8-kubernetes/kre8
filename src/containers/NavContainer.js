import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';

import NavComponent from '../components/NavComponent.js';

import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';


const mapStateToProps = store => ({
  showCreateButton: store.navbar.showCreateButton,
  showCreateMenu: store.navbar.showCreateMenu,
  showCreateMenuItem: store.navbar.showCreateMenuItem,
  menuItemToShow: store.navbar.menuItemToShow,
  showClusterInfo: store.navbar.showClusterInfo,
  clusterInfo: store.navbar.clusterInfo
});

const mapDispatchToProps = dispatch => ({
  displayCreateButton: () => {
    dispatch(actions.displayCreateButton())
  },
  hideCreateButton: () => {
    dispatch(actions.hideCreateButton())
  },
  toggleCreateMenu: () => {
    dispatch(actions.toggleCreateMenu())
  },
  hideCreateMenu: () => {
    dispatch(actions.hideCreateMenu())
  },
  toggleCreateMenuItem: () => {
    dispatch(actions.toggleCreateMenuItem())
  },
  CreateMenuItem: () => {
    dispatch(actions.toggleCreateMenuItem())
  },
  menuItemToShow: (menuItem) => {
    dispatch(actions.menuItemToShow(menuItem))
  },
  displayClusterInfo: () => {
    dispatch(actions.displayClusterInfo())
  },
  hideClusterInfo: () => {
    dispatch(actions.hideClusterInfo())
  },
  updateClusterData: (clusterData) => {
    dispatch(actions.updateClusterData(clusterData))
  }
});

class NavContainer extends Component {
  constructor(props) {
    super(props);
    this.handleMenuItemToShow = this.handleMenuItemToShow.bind(this);
    this.handleNavBarClick = this.handleNavBarClick.bind(this);
    this.handleClusterData = this.handleClusterData.bind(this);
  }

  //**--------------COMPONENT LIFECYCLE METHODS-----------------**//

  componentDidMount() {
    ipcRenderer.on(events.SEND_CLUSTER_DATA, this.handleClusterData)
    ipcRenderer.send(events.GET_CLUSTER_DATA);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(events.SEND_CLUSTER_DATA, this.handleClusterData)
  }


  handleMenuItemToShow(e) {
    console.log('e.target', e.target);
    this.props.menuItemToShow(e.target.id);
    this.props.toggleCreateMenuItem();
  }

  handleNavBarClick(e) {
    if (e.target.id === 'kubectl_link') {
      this.props.displayCreateButton();
    } else {
      this.props.hideCreateButton();
    }
    this.props.hideCreateMenu();
  }

  handleClusterData(event, data) {
    console.log("data on cluster: ", data);
    this.props.updateClusterData(data);
  }

  render() {
    const { 
      showCreateButton,
      showCreateMenu,
      showCreateMenuItem,
      menuItemToShow,
      clusterInfo,
      showClusterInfo,

      toggleCreateMenu,
      hideCreateButton,
      displayCreateButton,
      hideClusterInfo,
      displayClusterInfo
    } = this.props;
    return (
      <div className="nav_container">
        <NavComponent 
          showCreateButton={showCreateButton}
          showCreateMenu={showCreateMenu}
          showCreateMenuItem={showCreateMenuItem}
          menuItemToShow={menuItemToShow}
          showClusterInfo={showClusterInfo}
          clusterInfo={clusterInfo}

          toggleCreateMenu={toggleCreateMenu}
          hideCreateButton={hideCreateButton}
          displayCreateButton={displayCreateButton}
          hideClusterInfo={hideClusterInfo}
          displayClusterInfo={displayClusterInfo}
          handleMenuItemToShow={this.handleMenuItemToShow}
          handleNavBarClick={this.handleNavBarClick}
        />
      </div>
    )
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NavContainer));