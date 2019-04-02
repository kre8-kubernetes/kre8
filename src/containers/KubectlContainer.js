import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import * as actions from '../store/actions/actions';
import TreeGraphContainer from './TreeGraphContainer';
import CreateMenuItemContainer from './CreateMenuItemContainer';

//* --------------- STATE + ACTIONS FROM REDUX ----------------- *//
const mapStateToProps = store => ({
  showCreateMenuFormItem: store.navbar.showCreateMenuFormItem,
});

const mapDispatchToProps = dispatch => ({
  displayCreateMenuButton: () => {
    dispatch(actions.displayCreateMenuButton());
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
    const { displayCreateMenuButton } = this.props;
    displayCreateMenuButton();
  }

  render() {
    const { showCreateMenuFormItem } = this.props;

    return (
      <div className="kubectl_container">
        {showCreateMenuFormItem === true && <CreateMenuItemContainer />}
        <TreeGraphContainer />
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(KubectlContainer));
