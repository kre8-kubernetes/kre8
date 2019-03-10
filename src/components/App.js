import React, { Component } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import NavContainer from '../containers/NavContainer.js';
import MainContainer from '../containers/MainContainer.js';

// const { BrowserWindow } = require('electron')
// let win = new BrowserWindow({ width: 800, height: 600, frame: false })
// win.show()

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestionCircle, faBars } from '@fortawesome/free-solid-svg-icons'

library.add(faQuestionCircle, faBars);

class App extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Router>
        <div>
          <NavContainer />
          <MainContainer />
        </div>
      </Router>
    );
  }
}

export default App;