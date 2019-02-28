import * as types from '../actionTypes.js'

const initialState = {
  showCreateButton: false,
  showCreateMenu: false,
  showCreateMenuItem: false,
  menuItemToShow: 'none',
};

export default function kubectlReducers(state = initialState, action) {
  let newState;

  switch (action.type) {
    case types.SHOW_CREATE_BUTTON:
      return {...state, showCreateButton: true};
    case types.HIDE_CREATE_BUTTON:
      return {...state, showCreateButton: false};
    case types.TOGGLE_CREATE_MENU:
      return {...state, showCreateMenu: !state.showCreateMenu}
    case types.HIDE_CREATE_MENU:
      return {...state, showCreateMenu: false}
    case types.TOGGLE_CREATE_MENU_ITEM:
      return {...state, showCreateMenuItem: !state.showCreateMenuItem}
    case types.MENU_ITEM_TO_SHOW:
      return {...state, menuItemToShow: action.payload}
    default:
      return state;
  }
}
