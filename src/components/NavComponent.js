import React from 'react';
import { Link } from 'react-router-dom';

const NavComponent = () => {
  return (
    <div>
      <Link to="/">AWS</Link>
      <Link to="/cluster">Kubectl</Link>
    </div>
  )
}

export default NavComponent;