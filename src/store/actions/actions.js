import * as types from '../actionTypes.js'

export function setRole(text) {
  return {
    type: types.SET_NEW_ROLE,
    payload: text
  };
}

export function setPod(data) {
  return {
    type: types.SET_NEW_POD,
    payload: data
  };
}

export function setDeployment(data) {
  return {
    type: types.SET_NEW_DEPLOYMENT,
    payload: data
  };
}

export function setService(data) {
  return {
    type: types.SET_NEW_SERVICE,
    payload: data
  };
}