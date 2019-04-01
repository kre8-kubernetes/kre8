import * as types from '../actionTypes';

const initialState = {
  showCreateButton: false,
  showCreateMenu: false,
  showCreateMenuItem: false,
  menuItemToShow: 'none',
  showClusterInfo: false,
  clusterInfo: {
    clusterName: '',
    createdDate: '',
    clusterArn: '',
    iamRoleName: '',
    iamRoleArn: '',
    stackName: '',
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
    case types.SHOW_CREATE_BUTTON:
      return { ...state, showCreateButton: true };
    case types.HIDE_CREATE_BUTTON:
      return { ...state, showCreateButton: false };
    case types.TOGGLE_CREATE_MENU:
      return { ...state, showCreateMenu: !state.showCreateMenu };
    case types.HIDE_CREATE_MENU:
      return { ...state, showCreateMenu: false };
    case types.TOGGLE_CREATE_MENU_ITEM:
      return { ...state, showCreateMenuItem: !state.showCreateMenuItem };
    case types.MENU_ITEM_TO_SHOW:
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
