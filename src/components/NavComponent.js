import React from 'react';
import { Link } from 'react-router-dom';

const NavComponent = () => {
  return (
    <div>

    <div className='nav1'>
      <Link to="/">HOME</Link>
      </div>

      <div className='nav2'>
      <Link to="/aws">AWS</Link>
      </div>
      
      <div className='nav3'>
      <Link to="/cluster">KUBECTL</Link>
      </div>

    </div>
  )
}

export default NavComponent;