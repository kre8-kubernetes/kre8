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