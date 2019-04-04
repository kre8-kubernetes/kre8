import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';


//When you click the button, we display this modal. 
const HelpInfoComponent = (props) => {
  const { aws } = props;
    return (
      aws === true ? 
        <div className="aws_help_info_component">
        <p>{props.textInfo}</p>
        <button onClick={props.hideInfoHandler}>X</button>
        </div>
      :
      
      <div className="help_info_component">
      <p>{props.textInfo}</p>
      <br>
      </br>
      <button onClick={props.hideInfoHandler}>X</button>
    </div>
  )
}

export default HelpInfoComponent;