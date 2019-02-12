import React from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';
import NavComponent from '../components/NavComponent.js';

const NavContainer = (props) => {
  return (
    <div>
      <NavComponent />
    </div>
  )
}

export default withRouter(connect(null, null)(NavContainer));