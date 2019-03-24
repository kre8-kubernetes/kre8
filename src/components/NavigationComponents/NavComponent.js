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
        <div className='nav_left_container_item'>
          <div onClick={props.handleNavBarClick} className='nav_item2'>
            <Link to="/">HOME</Link>
          </div>
        </div>
        <div className='nav_left_container_item'>
          <div onClick={props.handleNavBarClick} className='nav_item2'>
            <Link to="/aws">AWS</Link>
          </div>      
        </div>
        <div className='nav_left_container_item'>
          <div id='kubectl_link' onClick={props.handleNavBarClick} className='nav_item2'>
            <Link id='kubectl_link' to="/cluster">KUBECTL</Link>
          </div>
        </div>
      </div>
      {/* NAV RIGHT CONTAINER */}
      <div className='nav_right_container'>
        <div className='nav_component_container_item'>
          <button className='nav_component_cluster_button' onMouseEnter={props.displayClusterInfo}>
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

 {/* onMouseLeave={props.hideClusterInfo} */}