import * as types from '../actionTypes.js'

// ******************************
// ******* NAVBAR ACTIONS *******
// ******************************

export const displayCreateButton = () => ({
  type: types.SHOW_CREATE_BUTTON
});

export const hideCreateButton = () => ({
  type: types.HIDE_CREATE_BUTTON
});

export const toggleCreateMenu = () => ({
  type: types.TOGGLE_CREATE_MENU
});

export const toggleCreateMenuItem = () => ({
  type: types.TOGGLE_CREATE_MENU_ITEM
});

export const menuItemToShow = (menuItem) => ({
  type: types.MENU_ITEM_TO_SHOW
});


// ******************************
// ******* Kubectl ACTIONs ******
// ******************************

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