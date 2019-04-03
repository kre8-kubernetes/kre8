import React from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import NavContainer from '../containers/NavContainer';
import MainContainer from '../containers/MainContainer';

const App = () => (
  <HashRouter>
    <div>
      <NavContainer />
      <MainContainer />
    </div>
  </HashRouter>
);

export default App;
