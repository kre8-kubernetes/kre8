import * as types from '../actionTypes.js'

const initialState = {
  roleName: ''
};

export default function awsReducers(state = initialState, action) {
  switch (action.type) {
    case types.SET_NEW_ROLE:
      return Object.assign({}, state, {
        roleName: action.payload
      });
    default:
      return state;
  }
}