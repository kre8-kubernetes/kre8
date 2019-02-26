import React from 'react';
import { Link } from 'react-router-dom';
// import icon from '../assets/pulsating-heptagon.gif';


const NavComponent = () => {
  return (
    <div className='nav_component_container'>
      {/* <div className='nav_item'>
      <img src={icon} alt="icon" className="icon"/>;
      </div>
      &nbsp; */}
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