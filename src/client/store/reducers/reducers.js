import { combineReducers } from 'redux';
import aws from './awsReducers';
import kubectl from './kubectlReducers';
import navbar from './navbarReducers';

export default combineReducers({
  aws,
  kubectl,
  navbar,
});
