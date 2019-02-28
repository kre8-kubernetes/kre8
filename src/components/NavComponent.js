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
    </div>
  )
}

export default NavComponent;