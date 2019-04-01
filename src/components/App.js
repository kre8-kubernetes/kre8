import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import NavContainer from '../containers/NavContainer';
import MainContainer from '../containers/MainContainer';

const App = (props) => {
  return (
    <Router>
      <div>
        <NavContainer />
        <MainContainer />
      </div>
    </Router>
  );
};

export default App;
