import React from 'react';
import InfoBodyComponent from './InfoBodyComponent';
import ActionButton from '../Buttons/ActionButton';
import CloseButton from '../Buttons/CloseButton';

const PodInfoComponent = (props) => {
  const {
    data,
    deleteNode,
    hideNodeInfo,
    loadingScreen,
  } = props;

  return (
    <div>
      {
        (!loadingScreen)
          ? (
            <div className="pod_info_component">
              <CloseButton clickHandler={hideNodeInfo} />
              <InfoBodyComponent data={data} />
              <div className="more_info_button_item">
                <ActionButton id="pod_delete_button" clickHandler={deleteNode} buttonText="Delete Deployment" />
                {/* <button className="action_button" onClick={deleteNode} type="button">Delete Deployment</button> */}
              </div>
            </div>
          )
          : (
            <div className="pod_info_component pod_info_component_loading">
              <svg id="heptagon_loading" className="pod_info_component_heptagon_loading">
                <g transform="translate(-3.722589840316431,-136.36553658320645)
                  scale(2.2474316850393237)
                  rotate(-15,101.04986267322434,131.70723811769813)"
                >
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
    }
    </div>
  );
};

export default PodInfoComponent;


//   // return (
//     {/* <div className="pod_info_component">
//       <CloseButton clickHandler={hideNodeInfo} />
//       <InfoBodyComponent data={data} />
//       <div className="more_info_button_item">
//         <ActionButton id="pod_delete_button" clickHandler={deleteNode} buttonText="Delete Deployment" />
//         <button className="action_button" onClick={deleteNode} type="button">Delete Deployment</button>
//       </div>
//     </div> */}
//   // );
//   // return (
//   //   <div className="pod_info_component pod_info_component_loading">
//   //     <svg id="heptagon_loading" className="pod_info_component_heptagon_loading">
//   //       <g transform="translate(-3.722589840316431,-136.36553658320645)
//   //           scale(2.2474316850393237)
//   //           rotate(-15,101.04986267322434,131.70723811769813)"
//   //       >
//   //         <path
//   //           d="M140,
//   //             152.83345844306322L109,
//   //             175.880461372843L72,
//   //             166.17923805805214L56,
//   //             130.9218798280204L73,
//   //             96.24675420539563L111,
//   //             87.86058520236253L141,
//   //             111Z"
//   //         />
//   //       </g>
//   //     </svg>
//   //   </div>
//   // );
// //};
