import React from 'react';
import ActionButton from '../Buttons/ActionButton';
import CloseButton from '../Buttons/CloseButton';
import HelpInfoButton from '../Buttons/HelpInfoButton';

const CreateMenuItemComponent = (props) => {
  const {
    handleChange,
    menuItemToShow,
    handleFormClose,
    handleFunction,
    errors,
    //infoText,
    infoButton,
    inputDataToShow,
    showHelpInfoComponent,
  } = props;

  const introText = {
    pod: 'Please input the details below to deploy a pod. Note that because pods do not attach to a Worker Node, they will not be displayed or editable from the graph.',
    // pod: 'A Pod is the smallest deployable unit in the Kubernetes object model.',
    service: 'Please input the details below to deploy a Service. A Service is an abstraction which defines a set of Pods and a policy by which to access them. Note that once created, a service will not be displayed or editable from the graph.',
    deployment: 'Please input the details below to launch a Deployment.',
  };
  const infoText = introText[menuItemToShow];

  // const warningText = {
  //   pod: 'Because pods do not attach to a Worker Node, they will not be displayed or editable from the graph.',
  //   service: 'Services will not be displayed or editable from the graph.',
  //   deployment: '',
  // };
  // const warningTextToDisplay = warningText[menuItemToShow];

  const inputExplainerText = {
    pod: {
      podName: '*253 character max, including lowercase alphanumeric and "-" and "."',
      containerName: '*253 character max, including lowercase alphanumeric and "-" and "."',
      imageName: '*253 character max, including lowercase alphanumeric and "-" and "."',
    },
    service: {
      serviceName: '*253 character max, including lowercase alphanumeric and "-" and "."',
      applicationName: '*253 character max, including lowercase alphanumeric and "-" and "."',
      port: '*Port exposed by the service',
      targetPort: '*iSCSI Target Portal, either an IP or ip_addr:port',
    },
    deployment: {
      deploymentName: '*253 character max, including lowercase alphanumeric and "-" and "."',
      applicationName: '*253 character max, including lowercase alphanumeric and "-" and "."',
      containerName: '*253 character max, including lowercase alphanumeric and "-" and "."',
      image: '*253 character max, including lowercase alphanumeric and "-" and "."',
      containerPort: '*Port to expose from the container',
      replicas: '*Kre8 enables the deployment of a maximum of 6 replicas',
    },
  };

  // const inputExplainerTextToDisplay = inputExplainerText[menuItemToShow][inputName];


  const componentNameFormatted = menuItemToShow.charAt(0).toUpperCase() + menuItemToShow.slice(1);
  const formItems = Object.entries(inputDataToShow).map((arr, i) => {
    const inputName = arr[0];
    console.log('inputName: ', inputName)
    const inputVal = arr[1];
    const placeholder = inputName.charAt(0).toUpperCase() + inputName.split(/(?=[A-Z])/).join(' ').slice(1);
    const id = `${menuItemToShow}_${inputName}`;
    return (
      <div key={i} className="create_menu_item_component_inputs_item">
        <input id={id} value={inputVal} placeholder={placeholder} onChange={handleChange} type="text" />
        {(!errors[menuItemToShow][inputName])
          ? (
            <div className="aws_cluster_form_container_explainer_text">
              {inputExplainerText[menuItemToShow][inputName]}
            </div>
          )
          : (
            <div className="errorClass">{errors[menuItemToShow][inputName]}</div>
          )
        }
      </div>
    );
  });

  return (
    <div className="popup_form_inner">
      <div className="create_menu_item_component_container">
        {/** ***TITLE*** */}
        {/* <button onClick={handleFormClose} className="close_popup_button" type="button">X</button> */}
        <CloseButton clickHandler={handleFormClose} />
        <div className="create_menu_item_component_title">
          <h2>Create a {componentNameFormatted}</h2>
        </div>
        <div className="create_menu_item_component_help_info">
          {infoText}
          &nbsp;
          <a href="https://kubernetes.io/docs/concepts/configuration/overview/">Learn more >></a>
        </div>
        {/** ** FORM *** */}
        <div className="create_menu_item_component_inputs">
          {formItems}
        </div>
        <div className="create_menu_item_component_help_info_warning_text">
          {/* {warningTextToDisplay}
          &nbsp; */}
          {/* <a href="https://kubernetes.io/docs/concepts/configuration/overview/">Kubernetes best practices >></a> */}
        </div>
        {/** ** BUTTONS *** */}
        <div className="create_menu_item_component_buttons">
          <ActionButton clickHandler={handleFunction} buttonText="Create" />
          <a href="" alt="">
            {/* <HelpInfoButton clickHandler={showHelpInfoComponent} /> */}
          </a>
        </div>
      </div>
    </div>
  );
};

export default CreateMenuItemComponent;
