import * as types from '../actionTypes';

const initialState = {
  credentialStatus: true,
  hasCheckedCredentials: false,
  creatingCluster: false,
};

export default function awsReducers(state = initialState, action) {
  switch (action.type) {
    case types.SET_CREDENTIAL_STATUS_TO_TRUE:
      return { ...state, credentialStatus: true };
    case types.SET_CREDENTIAL_STATUS_TO_FALSE:
      return { ...state, credentialStatus: false };
    case types.CHECK_CREDENTIALS_TRUE:
      return { ...state, hasCheckedCredentials: true };
    case types.CHECK_CREDENTIALS_FALSE:
      return { ...state, hasCheckedCredentials: false };
    case types.TOGGLE_CREATING_CLUSTER:
      return {
        ...state,
        creatingCluster: typeof action.payload === 'boolean' ? action.payload : !state.creatingCluster,
      };
    default:
      return state;
  }
}
