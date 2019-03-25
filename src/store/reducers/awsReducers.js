import * as types from '../actionTypes.js'

const initialState = {
  credentialStatus: false,
  hasCheckedCredentials: false
};

export default function awsReducers(state = initialState, action) {
  switch (action.type) {
    case types.SET_CREDENTIAL_STATUS_TO_TRUE:
      return { ...state, credentialStatus: true };
    case types.SET_CREDENTIAL_STATUS_TO_FALSE:
      return { ...state, credentialStutus: false }
    case types.CHECK_CREDENTIALS_TRUE:
      return { ...state, hasCheckedCredentials: true }  
    case types.CHECK_CREDENTIALS_FALSE: 
      return { ...state, hasCheckedCredentials: false }
    default:
      return state;
  }
};