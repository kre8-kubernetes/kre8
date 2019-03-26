// import * as types from '../actionTypes.js'

// const initialState = {
//     // pod_podName: '',
//     // pod_containerName: '',
//     // pod_imageName: '',
//     pods: [],
//     deployments: [],
//     services: []
// };

// export default function kubectlReducers(state = initialState, action) {
//   let newState;

//   switch (action.type) {
//     case types.SET_NEW_POD:
//       newState = state.slice();
//       newState.pods.push(action.payload);
//       return newState;

//     case types.SET_NEW_DEPLOYMENT:
//       newState = state.slice();
//       newState.deployments.push(action.payload);
//       return newState;

//     case types.SET_NEW_SERVICE:
//       newState = state.slice();
//       newState.services.push(action.payload);
//       return newState;
  
//     default:
//     return state;
//   }
// }
