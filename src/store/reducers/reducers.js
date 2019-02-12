import { combineReducers } from 'redux';
import aws from './awsReducers';
import kubectl from './kubectlReducers';

export default combineReducers({
  aws: aws,
  kubectl: kubectl
})