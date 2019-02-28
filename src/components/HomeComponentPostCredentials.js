import React from "react";
import '../styles.css'
import { Link } from 'react-router-dom';



const HomeComponent = props => {
  return (
    <div className='home_page_item'>
      
      <div className='home_page_form_container'>

        <h1>Kre8</h1>
          <h2>Create and Deploy your Kubernetes Cluster to the Cloud</h2>
          <div className="p_container">
          <p>Creating and launching your Kubernetes cluster to the Amazon cloud can be a long and complicated process. 
            Kre8 is here to simplify everything for you. Let's get started!</p>
            </div>
            {/* <button id="" onClick={this.props.displayInfoHandler(id)}></button> */}
            <br></br>
            <button onClick={props.handleButtonClickOnHomeComponentPostCredentials} className="buttons">Submit</button>
       
        </div>

    </div>
    );
  };
  
  export default HomeComponent;
  