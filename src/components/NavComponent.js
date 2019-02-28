import React from 'react';
import { Link } from 'react-router-dom';
import CreateMenuComponent from './CreateMenuComponent'


const NavComponent = (props) => {
  return (
    <div className='nav_component_container'>
      {props.showCreateButton === true && (
        <button onClick={props.toggleCreateMenu}>+++</button>
      )}
      {props.showCreateMenu === true && (
        <CreateMenuComponent 
          handleMenuItemToShow={props.handleMenuItemToShow}
        />
      )}
      <div onClick={props.handleNavBarClick} className='nav_item2'>
        <Link to="/">HOME</Link>
      </div>
      &nbsp;
      <div onClick={props.handleNavBarClick} className='nav_item2'>
        <Link to="/aws">AWS</Link>
      </div>
      &nbsp;
      <div id='kubectl_link' onClick={props.handleNavBarClick} className='nav_item2'>
        <Link id='kubectl_link' to="/cluster">KUBECTL</Link>
      </div>
    </div>
  )
}

 

export default NavComponent;