import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { Switch, Route, withRouter } from 'react-router-dom';

import HomeComponent from '../components/HomeComponent'

class HomeContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      aws_access_key_id: '',
      aws_secret_access_key_id: ''
    }
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    e.preventDefault();
    this.setState({ [e.target.name]: e.target.value });
  }

  handleSubmit() {
    console.log('handleChangeScreen Clicked!!!');
    this.props.history.push('/aws')
  }

  render() {
    return (
      <div>
        <HomeComponent 
          handleChange={this.handleChange}
          aws_access_key_id={this.state.aws_access_key_id}
          aws_secret_access_key_id={this.state.aws_secret_access_key_id}
          handleSubmit={this.handleSubmit}
        />
      </div>
    );
  }
}

export default withRouter(connect(null, null)(HomeContainer));