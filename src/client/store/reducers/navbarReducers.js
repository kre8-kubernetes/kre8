import * as types from '../actionTypes';

const initialState = {
  showCreateMenuButton: false,
  showCreateMenuDropdown: false,
  showCreateMenuFormItem: false,
  menuItemToShow: 'none',
  showClusterInfo: false,
  clusterInfo: {
    clusterName: '',
    createdDate: '',
    clusterArn: '',
    iamRoleName: '',
    iamRoleArn: '',
    šstackName: '',
    vpcId: '',
    securityGroupIds: '',
    subnetIdsArray: '',
    serverEndPoint: '',
    KeyName: '',
    workerNodeStackName: '',
    nodeInstanceRoleArn: '',
  },
};

export default function navbarReducers(state = initialState, action) {
  switch (action.type) {
    case types.SHOW_CREATE_MENU_BUTTON:
      return { ...state, showCreateMenuButton: true };
    case types.HIDE_CREATE_MENU_BUTTON:
      return { ...state, showCreateMenuButton: false };
    case types.TOGGLE_CREATE_MENU_DROPDOWN:
      return {
        ...state,
        showCreateMenuDropdown: typeof action.payload === 'boolean' ? action.payload : !state.showCreateMenuDropdown,
      };
    case types.HIDE_CREATE_MENU_DROPDOWN:
      return { ...state, showCreateMenuDropdown: false };
    case types.TOGGLE_CREATE_MENU_FORM_ITEM:
      return {
        ...state,
        showCreateMenuFormItem: typeof action.payload === 'boolean' ? action.payload : !state.showCreateMenuFormItem,
      };
    case types.MENU_FORM_ITEM_TO_SHOW:
      return { ...state, menuItemToShow: action.payload };
    case types.DISPLAY_CLUSTER_INFO:
      return { ...state, showClusterInfo: true };
    case types.HIDE_CLUSTER_INFO:
      return { ...state, showClusterInfo: false };
    case types.UPDATE_CLUSTER_DATA:
      return { ...state, clusterInfo: action.payload };
    default:
      return state;
  }
}
