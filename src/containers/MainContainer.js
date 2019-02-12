import React from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';

import AWSContainer from './AWSContainer';
import KubectlContainer from './KubectlContainer';

const Main = (props) => {
  return (
    <div>
      <Switch>
        <Route
          exact path='/'
          component={AWSContainer}
        />
        <Route
          exact path='/cluster'
          component={KubectlContainer}
        />
      </Switch>
    </div>
  )
}

export default withRouter(connect(null, null)(Main));
