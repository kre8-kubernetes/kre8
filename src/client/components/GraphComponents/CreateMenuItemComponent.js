import React from 'react';
import ActionButton from '../Buttons/ActionButton';
import CloseButton from '../Buttons/CloseButton';

const CreateMenuItemComponent = (props) => {
  const {
    handleChange,
    menuItemToShow,
    handleFormClose,
    handleFunction,
    errors,
    infoButton,
    inputDataToShow,
    showHelpInfoComponent,
    createLoadingScreen,
    creationError,
    creationErrorText,
  } = props;

  const introText = {
    pod: 'Please input the details below to deploy a pod. Note that because pods do not attach to a Worker Node, they will not be displayed or editable from the graph.',
    service: 'Please input the details below to deploy a Service. A Service is an abstraction which defines a set of Pods and a policy by which to access them. Note that once created, a service will not be displayed or editable from the graph.',
    deployment: 'Please input the details below to launch a Deployment.',
  };
  const infoText = introText[menuItemToShow];

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
    <div>
      {
        (!createLoadingScreen)
          ? (
            <div className="popup_form_inner">
              <div className="create_menu_item_component_container">
                {/** ***CLOSE BUTTON*** */}
                <CloseButton clickHandler={handleFormClose} />
                {/** ***TITLE*** */}
                <div className="create_menu_item_component_title"><h2>Create a {componentNameFormatted}</h2></div>
                {/** ***INTRO TEXT*** */}
                <div className="create_menu_item_component_help_info">
                  {infoText}&nbsp;<a href="https://kubernetes.io/docs/concepts/configuration/overview/">Explore the Kubernetes docs >></a>
                </div>
                {/** ** FORM *** */}
                <div className="create_menu_item_component_inputs">
                  {formItems}
                </div>
                {/** ** CREATE BUTTON *** */}
                <div className="create_menu_item_component_buttons">
                  <ActionButton clickHandler={handleFunction} buttonText="Create" />
                </div>
              </div>
            </div>
          )
          : (
            <div>
              {(creationError === false)
                ? (
                  <div className="popup_form_inner popup_form_inner_create_loading">
                    <svg id="heptagon_loading" className="pod_info_component_heptagon_loading pod_info_component_create_heptagon_loading">
                      <g transform="translate(-3.722589840316431,-136.36553658320645) scale(2.2474316850393237) rotate(-15,101.04986267322434,131.70723811769813)">
                        <path
                          d="M140,
                            152.83345844306322L109,
                            175.880461372843L72,
                            166.17923805805214L56,
                            130.9218798280204L73,
                            96.24675420539563L111,
                            87.86058520236253L141,
                            111Z"
                        />
                      </g>
                    </svg>
                  </div>
                )
                : (
                  <div className="popup_form_inner popup_form_inner_create_loading">
                    <CloseButton clickHandler={handleFormClose} />
                    <div className="popup_form_inner_error_text_title">Error</div>
                    <div className="popup_form_inner_error_text_intro">An error occurred while creating your component. Below is the error message from Kubernetes:</div>
                    <div className="errorClass" id="create_menu_item_component_loading_error">{creationErrorText}</div>
                  </div>
                )}
            </div>
          )
        }
    </div>
  );
};

export default CreateMenuItemComponent;
