import React from 'react';
import { Link } from 'react-router-dom';

const NavComponent = () => {
  return (
    <div>
      <Link to="/">HOME</Link><Link to="/aws">AWS</Link><Link to="/cluster">KUBECTL</Link>
    </div>
  )
}

export default NavComponent;