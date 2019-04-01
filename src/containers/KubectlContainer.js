import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import * as actions from '../store/actions/actions';
import TreeGraphContainer from './TreeGraphContainer';
import CreateMenuItemContainer from './CreateMenuItemContainer';

//* --------------- STATE + ACTIONS FROM REDUX ----------------- *//
const mapStateToProps = store => ({
  showCreateMenuItem: store.navbar.showCreateMenuItem,
});

const mapDispatchToProps = dispatch => ({
  displayCreateButton: () => {
    dispatch(actions.displayCreateButton());
  },
});

//* -------------- KUBECTL GRAPH COMPONENT -------------------------------- *//
class KubectlContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  //* -------------- COMPONENT LIFECYCLE METHODS
  componentDidMount() {
    const { displayCreateButton } = this.props;
    displayCreateButton();
  }

  render() {
    const { showCreateMenuItem } = this.props;

    return (
      <div className="kubectl_container">
        {showCreateMenuItem === true && <CreateMenuItemContainer />}
        <TreeGraphContainer />
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(KubectlContainer));
