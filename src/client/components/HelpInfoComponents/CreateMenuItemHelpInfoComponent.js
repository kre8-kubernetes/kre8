import React from 'react';
import CloseButton from '../Buttons/CloseButton';

const CreateMenuItemHelpInfoComponent = (props) => {
  const { showHelpInfoComponent } = props;
  return (
    <div className="more_info_component create_menu_item_help_info_component">
      <div className="create_menu_item_help_info_component_close_button">
        <CloseButton clickHandler={showHelpInfoComponent}/>
      </div>
      <div className="more_info_component_title create_menu_item_help_info_component_title">
        Creating A Pod
      </div>
      <div className="more_info_component_explainer_text create_menu_item_help_info_component_text">
        <div>Pods, hosts to containers via images, are the smallest deployable units of computing that can be created in Kubernetes.</div>
        <div>A pod’s contents are always co-located and co-scheduled, and run in a shared context. Rather than deploying a single pod (which is not rescheduled in the event of a failure, or displayed on the Kre8 graph), Kubernetes recommends launching a Replica Set via a Deployment.</div>
        <div style={{ color: 'red' }}><i>A pod will not be displayed or editable on the KRE8 graph.</i></div>
      </div>
    </div>
  );
};

export default CreateMenuItemHelpInfoComponent;
