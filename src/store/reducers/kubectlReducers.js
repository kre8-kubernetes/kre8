import * as types from '../actionTypes.js'

const initialState = {
  podName: ''
};

export default function kubectlReducers(state = initialState, action) {
  switch (action.type) {
    case types.SET_NEW_POD:
      return Object.assign({}, state, {
        podName: action.payload
      });
    default:
      return state;
  }
}