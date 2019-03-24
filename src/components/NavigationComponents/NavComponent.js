import React from 'react';
import { Link } from 'react-router-dom';
import CreateMenuComponent from './CreateMenuComponent'
import ClusterInfoComponent from './ClusterInfoComponent'


const NavComponent = (props) => {
  return (
    <div className='nav_component_container'>
      {/* THE CREATE DROP DOWN MENU */}
      {props.showCreateMenu === true && (
        <CreateMenuComponent 
          handleMenuItemToShow={props.handleMenuItemToShow}
        />
      )}
      {/* NAV LEFT CONTAINER */}
      <div className='nav_left_container'>
        {props.showCreateButton === true && (
          <div id='nav_drop_down' className='nav_left_container_item' onClick={props.toggleCreateMenu}>
            <div className='ham_bar'></div>
            <div className='ham_bar'></div>
            <div className='ham_bar'></div>
          </div>
        )}
        <Link to="/" className='nav_left_container_item' onClick={props.handleNavBarClick}>HOME</Link>
        <Link to="/aws" className='nav_left_container_item' onClick={props.handleNavBarClick}>AWS</Link>
        <Link to="/cluster" className='nav_left_container_item' onClick={props.handleNavBarClick}>KUBECTL</Link>
      </div>
      {/* NAV RIGHT CONTAINER */}
      <div className='nav_right_container'>
        <div className='nav_component_container_item'>
          <button className='nav_component_cluster_button' onMouseEnter={props.displayClusterInfo}
          onMouseLeave={props.hideClusterInfo}
          >
          
            Cluster Data
          </button>
          {/* THE CLUSTER INFO BOX */}
          {props.showClusterInfo === true && (
          <ClusterInfoComponent
          clusterInfo={props.clusterInfo}
          />
          )}
      </div>
      </div>
    </div>
  )
}

 

export default NavComponent;
