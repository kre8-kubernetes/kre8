import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';


//When you click the button, we display this modal. 
const InfoComponent = props => {
    return (
      <div className="info_component">
        <h3>More Info!</h3>
        <p>{props.text_info}</p>
        <button onClick={props.hideInfoHandler}>Close</button>
      </div>
    );
  }

export default InfoComponent;

