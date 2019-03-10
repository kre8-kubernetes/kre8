import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';


//When you click the button, we display this modal. 
const HelpInfoComponent = (props) => {
    return (
      <div className="help_info_component">
        <h3>More Information</h3>
        <br>
        </br>
        <p>{props.text_info}</p>
        <br>
        </br>
        <button onClick={props.hideInfoHandler}>X</button>
      </div>
    );
  }

export default HelpInfoComponent;