import React from 'react';
import { Link } from 'react-router-dom';
import CreateMenuComponent from './CreateMenuComponent';
import ClusterInfoComponent from './ClusterInfoComponent';


const NavComponent = (props) => {
  const {
    handleNavBarClick,
    handleMenuItemToShow,

    showCreateButton,
    showCreateMenu,

    displayClusterInfo,
    hideClusterInfo,
    clusterInfo,
    showClusterInfo,

    toggleCreateMenu,
  } = props;

  return (
    <div className="nav_component_container">
      {/* THE CREATE DROP DOWN MENU */}
      {showCreateMenu === true && (
        <CreateMenuComponent
          handleMenuItemToShow={handleMenuItemToShow}
        />
      )}
      {/* NAV LEFT CONTAINER */}
      <div className="nav_left_container">
        {showCreateButton === true && (
          <div id="nav_drop_down" className="nav_left_container_item" onClick={toggleCreateMenu} onKeyPress={toggleCreateMenu} role="button" tabIndex={0}>
            <div className="ham_bar" />
            <div className="ham_bar" />
            <div className="ham_bar" />
          </div>
        )}
        <Link to="/" className="nav_left_container_item" onClick={handleNavBarClick}>HOME</Link>
        <Link to="/aws" className="nav_left_container_item" onClick={handleNavBarClick}>AWS</Link>
        <Link to="/cluster" className="nav_left_container_item" onClick={handleNavBarClick}>KUBECTL</Link>
      </div>
      {/* NAV RIGHT CONTAINER */}
      <div className="nav_right_container">
        <div className="nav_component_container_item">
          <button className="nav_component_cluster_button" type="button" onMouseEnter={displayClusterInfo} onMouseLeave={hideClusterInfo}>Cluster Data</button>
          {/* CLUSTER INFO DROPDOWN CONTAINER */}
          {showClusterInfo === true && (
          <ClusterInfoComponent clusterInfo={clusterInfo} />
          )}
        </div>
      </div>
    </div>
  );
};

export default NavComponent;
