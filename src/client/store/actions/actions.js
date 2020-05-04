import * as types from '../actionTypes';

//* ---------------------------------------------------------------- *//
//* ------------- AWS ACTIONS -------------------------------------- *//
//* ---------------------------------------------------------------- *//

export const setCredentialStatusTrue = () => ({
  type: types.SET_CREDENTIAL_STATUS_TO_TRUE,
});

export const setCredentialStatusFalse = () => ({
  type: types.SET_CREDENTIAL_STATUS_TO_FALSE,
});

export const setCheckCredentialsTrue = () => ({
  type: types.CHECK_CREDENTIALS_TRUE,
});

export const toggleCreatingCluster = bool => ({
  type: types.TOGGLE_CREATING_CLUSTER,
  payload: bool,
});

export const handleFormString = objProp => ({
  type: types.HANDLE_FORM_STRING,
  payload: objProp,
});

export const clearFormStrings = () => ({
  type: types.CLEAR_FORM_STRINGS,
});

//* ---------------------------------------------------------------- *//
//* ------------- NAVBAR ACTIONS ----------------------------------- *//
//* ---------------------------------------------------------------- *//

export const displayCreateMenuButton = () => ({
  type: types.SHOW_CREATE_MENU_BUTTON,
});

export const hideCreateMenuButton = () => ({
  type: types.HIDE_CREATE_MENU_BUTTON,
});

export const toggleCreateMenuDropdown = bool => ({
  type: types.TOGGLE_CREATE_MENU_DROPDOWN,
  payload: bool,
});

export const hideCreateMenuDropdown = () => ({
  type: types.HIDE_CREATE_MENU_DROPDOWN,
});

export const toggleCreateMenuFormItem = bool => ({
  type: types.TOGGLE_CREATE_MENU_FORM_ITEM,
  payload: bool,
});

export const menuItemToShow = menuItem => ({
  type: types.MENU_FORM_ITEM_TO_SHOW,
  payload: menuItem,
});

export const displayClusterInfo = () => ({
  type: types.DISPLAY_CLUSTER_INFO,
});

export const hideClusterInfo = () => ({
  type: types.HIDE_CLUSTER_INFO,
});

export const updateClusterData = clusterData => ({
  type: types.UPDATE_CLUSTER_DATA,
  payload: clusterData,
});
