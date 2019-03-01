import React, { Component } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import NavContainer from '../containers/NavContainer.js';
import MainContainer from '../containers/MainContainer.js';

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'

library.add(faQuestionCircle);

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