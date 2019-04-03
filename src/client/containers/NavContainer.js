import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import * as actions from '../store/actions/actions';
import * as events from '../../eventTypes';
import NavComponent from '../components/NavigationComponents/NavComponent';

// TODO: seem not to be using the following, i commented them out, awaiting approval to delete
// showCreateMenuFormItem,
// hideCreateMenuButton,
// displayCreateMenuButton,

//* --------------- STATE + ACTIONS FROM REDUX ----------------- *//
const mapStateToProps = store => ({
  // showCreateMenuFormItem: store.navbar.showCreateMenuFormItem;
  showCreateMenuButton: store.navbar.showCreateMenuButton,
  showCreateMenuDropdown: store.navbar.showCreateMenuDropdown,
  menuItemToShow: store.navbar.menuItemToShow,
  showClusterInfo: store.navbar.showClusterInfo,
  clusterInfo: store.navbar.clusterInfo,
});

const mapDispatchToProps = dispatch => ({
  // displayCreateMenuButton: () => {
  //   dispatch(actions.displayCreateMenuButton());
  // },
  // hideCreateMenuButton: () => {
  //   dispatch(actions.hideCreateMenuButton());
  // },
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
    const { menuItemToShow, toggleCreateMenuFormItem } = this.props;
    menuItemToShow(e.target.id);
    toggleCreateMenuFormItem(true);
  }

  handleNavBarClick(e) {
    const { hideCreateMenuDropdown } = this.props;
    hideCreateMenuDropdown();
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
        />
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NavContainer));
