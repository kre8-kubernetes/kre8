import React from 'react';
import { Link } from 'react-router-dom';
import CreateMenuComponent from './CreateMenuComponent'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';


const NavComponent = (props) => {
  return (
    <div className='nav_component_container'>
      {props.showCreateButton === true && (
        <button className="barsButton" onClick={props.toggleCreateMenu}><FontAwesomeIcon icon="bars" id="bars"/></button>
      )}
      {props.showCreateMenu === true && (
        <CreateMenuComponent 
          handleMenuItemToShow={props.handleMenuItemToShow}
        />
      )}
      <div onClick={props.hideCreateButton} className='nav_item'>
        <Link to="/">HOME</Link>
      </div>
      &nbsp;
      <div onClick={props.hideCreateButton} className='nav_item'>
        <Link to="/aws">AWS</Link>
      </div>
      &nbsp;
      <div onClick={props.displayCreateButton} className='nav_item'>
        <Link to="/cluster">KUBECTL</Link>
      </div>
      {/* <img src='../assets/logo.png' alt='logo' className='logo'/> */}
    </div>
  )
}

 

export default NavComponent;