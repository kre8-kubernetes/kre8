import * as types from '../actionTypes.js'

const initialState = {
  podName: '',
  deploymentName: '',
  serviceName: ''
};

export default function kubectlReducers(state = initialState, action) {
  switch (action.type) {
    case types.SET_NEW_POD:
      return Object.assign({}, state, {
        podName: action.payload
      });
    case types.SET_NEW_DEPLOYMENT:
      return Object.assign({}, state, {
        deploymentName: action.payload
      });
    case types.SET_NEW_SERVICE:
      return Object.assign({}, state, {
        serviceName: action.payload
      });
  
    default:
    return state;
  }
}
