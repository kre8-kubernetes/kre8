import { combineReducers } from 'redux';
import aws from './awsReducers';
import navbar from './navbarReducers';

export default combineReducers({
  aws,
  navbar,
});
