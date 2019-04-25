import React from 'react';
import { Link } from 'react-router-dom';
import ClusterInfoComponent from './ClusterInfoComponent';
import OutsideClick from '../../helperFunctions/OutsideClick';

/** ------------ NAVIGATION COMPONENT ------------------------------
  ** Rendered by the NavContainer; Renders ClusterInfoComponent when user clicks 'Cluster Info'
*/

const NavComponent = (props) => {
  const {
    handleNavBarClick,
    handleMenuItemToShow,
    handleOutsideDropdownClick,
    showCreateMenuButton,
    showCreateMenuDropdown,
    displayClusterInfo,
    hideClusterInfo,
    clusterInfo,
    showClusterInfo,
    toggleCreateMenuDropdown,
    creatingCluster,
    getAndDisplayClusterData,
  } = props;

  return (
    <div className="nav_component_container">
      {/* THE CREATE DROP DOWN MENU */}
      {showCreateMenuDropdown === true && (
        <OutsideClick className="create_menu_component_container" handleOutsideClick={handleOutsideDropdownClick}>
          <button id="pod" className="create_menu_component_container_button" onClick={handleMenuItemToShow} type="button">Create a Pod</button>
          <button id="service" className="create_menu_component_container_button" onClick={handleMenuItemToShow} type="button">Create a Service</button>
          <button id="deployment" className="create_menu_component_container_button" onClick={handleMenuItemToShow} type="button">Create a Deployment</button>
        </OutsideClick>
      )}
      {/* NAV LEFT CONTAINER */}
      <div className="nav_left_container">
        {showCreateMenuButton === true && (
          <div id="nav_drop_down" className="nav_left_container_item" onClick={toggleCreateMenuDropdown} onKeyPress={toggleCreateMenuDropdown} role="button" tabIndex={0}>
            <div className="ham_bar" />
            <div className="ham_bar" />
            <div className="ham_bar" />
          </div>
        )}
        <Link to={creatingCluster ? '/aws' : '/'} className="nav_left_container_item" onClick={handleNavBarClick}>HOME</Link>
        <Link to="/aws" className="nav_left_container_item" onClick={handleNavBarClick}>AWS</Link>
        <Link to={creatingCluster ? '/aws' : '/cluster'} className="nav_left_container_item" onClick={handleNavBarClick}>KUBECTL</Link>
      </div>
      {/* NAV RIGHT CONTAINER */}
      <div className="nav_right_container">
        <div className="nav_component_container_item">
          <button className="nav_component_cluster_button" type="button" onMouseEnter={getAndDisplayClusterData} onMouseLeave={hideClusterInfo}>CLUSTER DATA</button>
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
