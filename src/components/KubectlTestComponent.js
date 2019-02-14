import React from "react";
import '../styles.css'
import clouds from '../assets/clouds.jpeg'
import star from '../assets/Star.png'
import cube from '../assets/3d-cube.jpg'
import sphere from '../assets/Blue_sphere.png'

const KubectlTestComponent = props => {
  return (
    <div>

      
      <img src={clouds} alt="Clouds" className="image"/>;

      <br />
      <br />
      <div className="section">
      <form>
        Pod name:
        <br />
        <input type="text" name="Pod name" />
        <br />
        Container name:
        <br />
        <input type="text" name="Container name" />
        <br />
        Image:
        <br />
        <input type="text" name="Image name" />
        <br />
      </form>
      <br />
      <button onClick={props.handleCreatePod} className="buttons">Create a Pod</button>
      </div>

      <br />
      <br />
      <div className="section">
      <form>
        Deployment name:
        <br />
        <input type="text" name="Deployment name" />
        <br />
        App name:
        <br />
        <input type="text" name="App name" />
        <br />
        Container name:
        <br />
        <input type="text" name="Container name" />
        <br />
        Image:
        <br />
        <input type="text" name="Image name" />
        <br />
        Container Port:
        <br />
        <input type="text" name="Container port" />
        <br />
        Number of replicas:
        <br />
        <input type="text" name="Replicas" />
        <br />
      </form>
      <br />
      <button onClick={props.handleCreateDeployment} className="buttons">
        Create a Deployment
      </button>
      </div>

      <br />
      <br />
      <div className="section">
      <form>
        Service name:
        <br />
        <input type="text" name="Service name" />
        <br />
        App name:
        <br />
        <input type="text" name="App name" />
        <br />
        Container name:
        <br />
        <input type="text" name="Container name" />
        <br />
        Image:
        <br />
        <input type="text" name="Image name" />
        <br />
        Number of replicas:
        <br />
        <input type="text" name="Replicas" />
        <br />
      </form>
      <br />
      <button onClick={props.handleCreateService} className="buttons">Create a Service</button>
      </div>

      
        {/* <img src={sphere} alt="pod" className="pod"/>
        {/* {props.podName}/> */}
        {/* <img src={cube} alt="deployment" className="deployment"/>; */}
        {/* {props.deploymentName} */}
        {/* <img src={star} alt="service" className="service"/>; */}

        {/* {props.serviceName} */}
    </div>
  );
};

export default KubectlTestComponent;
