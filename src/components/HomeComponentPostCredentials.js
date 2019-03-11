import React from "react";
import '../styles.css'
import { Link } from 'react-router-dom';



const HomeComponent = props => {
  return (
    <div className='home_page_post_config_form_container'>
      <div className='home_page_form_container_header'>
        <h3>Manage your Kubernetes Cluster</h3>
      </div>
      <div className='home_page_form_container_text'>
        <p>Managing your Kubernetes cluster on the AWS cloud can be a complicated process. KRE8 is here to simplify everything for you.</p>
        </div>
            <br></br>
        <div className='home_page_form_container_buttons_item'>
            <button id='home_submit_button' onClick={props.handleButtonClickOnHomeComponentPostCredentials}>View Cluster</button>
        </div>
       
    </div>
    );
  };
  
  export default HomeComponent;
  