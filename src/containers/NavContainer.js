import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import * as actions from '../store/actions/actions';
import * as events from '../../eventTypes';
import NavComponent from '../components/NavigationComponents/NavComponent';

// TODO: seem not to be using the following, i commented them out, awaiting approval to delete
// showCreateMenuItem,
// hideCreateButton,
// displayCreateButton,


//* --------------- STATE + ACTIONS FROM REDUX ----------------- *//
const mapStateToProps = store => ({
  // showCreateMenuItem: store.navbar.showCreateMenuItem;
  showCreateButton: store.navbar.showCreateButton,
  showCreateMenu: store.navbar.showCreateMenu,
  menuItemToShow: store.navbar.menuItemToShow,
  showClusterInfo: store.navbar.showClusterInfo,
  clusterInfo: store.navbar.clusterInfo,
});

const mapDispatchToProps = dispatch => ({
  // displayCreateButton: () => {
  //   dispatch(actions.displayCreateButton());
  // },
  // hideCreateButton: () => {
  //   dispatch(actions.hideCreateButton());
  // },
  toggleCreateMenu: () => {
    dispatch(actions.toggleCreateMenu());
  },
  hideCreateMenu: () => {
    dispatch(actions.hideCreateMenu());
  },
  toggleCreateMenuItem: () => {
    dispatch(actions.toggleCreateMenuItem());
  },
  CreateMenuItem: () => {
    dispatch(actions.toggleCreateMenuItem());
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
  }

  //* --------------- COMPONENT LIFECYCLE METHODS ----------------- *//
  componentDidMount() {
    ipcRenderer.on(events.SEND_CLUSTER_DATA, this.handleClusterData);
    ipcRenderer.send(events.GET_CLUSTER_DATA);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(events.SEND_CLUSTER_DATA, this.handleClusterData);
  }

  //* --------------- COMPONENT METHODS --------------------------- *//
  handleMenuItemToShow(e) {
    const { menuItemToShow, toggleCreateMenuItem } = this.props;
    menuItemToShow(e.target.id);
    toggleCreateMenuItem();
  }

  handleNavBarClick(e) {
    const { hideCreateMenu } = this.props;
    hideCreateMenu();
  }

  handleClusterData(event, data) {
    const { updateClusterData } = this.props;
    updateClusterData(data);
  }

  //* --------------- RENDER LIFECYCLE METHOD --------------------- *//
  render() {
    const {
      showCreateButton,
      showCreateMenu,

      clusterInfo,
      showClusterInfo,
      hideClusterInfo,
      displayClusterInfo,

      toggleCreateMenu,
    } = this.props;

    //* --------------- RETURNING ----------------------------------- *//
    return (
      <div className="nav_container">
        <NavComponent
          handleNavBarClick={this.handleNavBarClick}

          showCreateButton={showCreateButton}
          showCreateMenu={showCreateMenu}
          toggleCreateMenu={toggleCreateMenu}

          handleMenuItemToShow={this.handleMenuItemToShow}

          clusterInfo={clusterInfo}
          showClusterInfo={showClusterInfo}
          displayClusterInfo={displayClusterInfo}
          hideClusterInfo={hideClusterInfo}
        />
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NavContainer));
