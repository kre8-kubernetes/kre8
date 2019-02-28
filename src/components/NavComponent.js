import React from 'react';
import { Link } from 'react-router-dom';


const NavComponent = (props) => {
  return (
    <div className='nav_component_container'>
      
      <div className='nav_item'>
        <Link to="/">HOME</Link>
      </div>
      &nbsp;
      <div className='nav_item'>
        <Link to="/aws">AWS</Link>
      </div>
      &nbsp;
      <div className='nav_item'>
        <Link to="/cluster">KUBECTL</Link>
      </div>
    </div>
  )
}

export default NavComponent;