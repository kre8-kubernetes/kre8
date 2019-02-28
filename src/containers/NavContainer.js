import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';
import NavComponent from '../components/NavComponent.js';

import * as actions from '../store/actions/actions.js';

const mapStateToProps = store => ({
  showCreateButton: store.navbar.showCreateButton,
  showCreateMenu: store.navbar.showCreateMenu,
  showCreateMenuItem: store.navbar.showCreateMenuItem,
  menuItemToShow: store.navbar.menuItemToShow,
});

const mapDispatchToProps = dispatch => ({
  showCreateButton: () => {
    dispatch(actions.showCreateButton())
  },
  hideCreateButton: () => {
    dispatch(actions.hideCreateButton())
  },
  toggleCreateMenu: () => {
    dispatch(actions.toggleCreateMenu())
  },
  menuItemToShow: (menuItem) => {
    dispatch(actions.menuItemToShow(menuItem))
  },
});

class NavContainer extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { showCreateButton, showCreateMenu, showCreateMenuItem, menuItemToShow } = this.props;
    return (
      <div className="nav_container">
        <NavComponent 
          showCreateButton={showCreateButton}
          showCreateMenu={showCreateMenu}
          showCreateMenuItem={showCreateMenuItem}
          menuItemToShow={menuItemToShow}
        />
      </div>
    )
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NavContainer));