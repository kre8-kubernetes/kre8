import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import * as actions from '../store/actions/actions';
import * as events from '../../eventTypes';
import NavComponent from '../components/NavigationComponents/NavComponent';

/** ------------ NAVIGATION CONTAINER — CONSTANTLY DISPLAYED AT SCREEN TOP ------------------
  ** Renders the NavComponent, which renders the ClusterInfoComponent
  *
*/

//* --------------- STATE + ACTIONS FROM REDUX ----------------- *//
const mapStateToProps = store => ({
  showCreateMenuButton: store.navbar.showCreateMenuButton,
  showCreateMenuDropdown: store.navbar.showCreateMenuDropdown,
  menuItemToShow: store.navbar.menuItemToShow,
  showClusterInfo: store.navbar.showClusterInfo,
  clusterInfo: store.navbar.clusterInfo,
});

const mapDispatchToProps = dispatch => ({
  toggleCreateMenuDropdown: (bool) => {
    dispatch(actions.toggleCreateMenuDropdown(bool));
  },
  hideCreateMenuDropdown: () => {
    dispatch(actions.hideCreateMenuDropdown());
  },
  toggleCreateMenuFormItem: (bool) => {
    dispatch(actions.toggleCreateMenuFormItem(bool));
  },
  menuItemToShow: (menuItem) => {
    dispatch(actions.menuItemToShow(menuItem));
  },
  displayClusterInfo: () => {
    dispatch(actions.displayClusterInfo());
  },
  hideClusterInfo: () => {
    dispatch(actions.hideClusterInfo());
  },
  updateClusterData: (clusterData) => {
    dispatch(actions.updateClusterData(clusterData));
  },
});

//* --------------- NAVIGATION COMPONENT --------------------------- *//
class NavContainer extends Component {
  constructor(props) {
    super(props);
    this.handleMenuItemToShow = this.handleMenuItemToShow.bind(this);
    this.handleNavBarClick = this.handleNavBarClick.bind(this);
    this.handleClusterData = this.handleClusterData.bind(this);
    this.handleOutsideDropdownClick = this.handleOutsideDropdownClick.bind(this);
    // for debugging main in production
    this.handleKubectlData = this.handleKubectlData.bind(this);
    this.handleMainError = this.handleMainError.bind(this);
    this.getAndDisplayClusterData = this.getAndDisplayClusterData.bind(this);
  }

  //* --------------- COMPONENT LIFECYCLE METHODS ----------------- *//
  componentDidMount() {
    ipcRenderer.send(events.GET_CLUSTER_DATA, 'request cluster data');
    ipcRenderer.on(events.SEND_CLUSTER_DATA, this.handleClusterData);
    // for debugging main in production
    ipcRenderer.on('kubectl', this.handleKubectlData);
    ipcRenderer.on('error', this.handleMainError);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(events.SEND_CLUSTER_DATA, this.handleClusterData);
    ipcRenderer.removeListener('kubectl', this.handleKubectlData);
    ipcRenderer.removeListener('error', this.handleMainError);
  }

  //* --------------- COMPONENT METHODS --------------------------- *//

  getAndDisplayClusterData(e) {
    const { clusterInfo, displayClusterInfo } = this.props;
    if (clusterInfo.clusterName === '') {
      ipcRenderer.send(events.GET_CLUSTER_DATA, 'request cluster data');
    }
    displayClusterInfo();
  }

  handleMenuItemToShow(e) {
    const { menuItemToShow, toggleCreateMenuFormItem, hideCreateMenuDropdown } = this.props;
    menuItemToShow(e.target.id);
    hideCreateMenuDropdown();
    toggleCreateMenuFormItem(true);
  }

  handleNavBarClick(e) {
    const { hideCreateMenuDropdown } = this.props;
    hideCreateMenuDropdown();
  }


  // FOR DEBUGGING the main in production
  handleKubectlData(event, data) {
    console.log('Errors from stderr', data.stderr);
    console.log('Errors from stdout', data.stdout);
  }

  handleMainError(event, data) {
    console.error('errror:', data);
  }

  handleClusterData(event, data) {
    const { updateClusterData } = this.props;
    updateClusterData(data);
  }

  handleOutsideDropdownClick(e) {
    const { toggleCreateMenuDropdown } = this.props;
    if (e.target.id !== 'nav_drop_down' && e.target.className !== 'ham_bar') {
      toggleCreateMenuDropdown(false);
    }
  }

  //* --------------- RENDER LIFECYCLE METHOD --------------------- *//
  render() {
    const {
      showCreateMenuButton,
      showCreateMenuDropdown,
      clusterInfo,
      showClusterInfo,
      hideClusterInfo,
      displayClusterInfo,
      toggleCreateMenuDropdown,
    } = this.props;

    //* --------------- RETURNING ----------------------------------- *//
    return (
      <div className="nav_container">
        <NavComponent
          handleNavBarClick={this.handleNavBarClick}
          showCreateMenuButton={showCreateMenuButton}
          showCreateMenuDropdown={showCreateMenuDropdown}
          toggleCreateMenuDropdown={toggleCreateMenuDropdown}
          handleMenuItemToShow={this.handleMenuItemToShow}
          handleOutsideDropdownClick={this.handleOutsideDropdownClick}
          clusterInfo={clusterInfo}
          showClusterInfo={showClusterInfo}
          displayClusterInfo={displayClusterInfo}
          hideClusterInfo={hideClusterInfo}
          getAndDisplayClusterData={this.getAndDisplayClusterData}
        />
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NavContainer));
