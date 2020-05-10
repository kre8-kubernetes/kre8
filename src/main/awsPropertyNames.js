const AWS_CREDENTIALS_STATUS = 'STATUS';
const AWS_CREDENTIALS_STATUS_CONFIGURED = 'CONFIGURED';

const CREATED = 'CREATED';
const CREATING = 'CREATING';
const ERROR = 'ERROR';

const IAM_ROLE_STATUS = 'iamRoleStatus';
const VPC_STACK_STATUS = 'stackStatus';
const CLUSTER_STATUS = 'clusterStatus';
const WORKER_NODE_STATUS = 'workerNodeStatus';
const KUBECTL_CONFIG_STATUS = 'kubectlConfigStatus';
const ERROR_MESSAGE = 'errorMessage';

const CLUSTER_POLICY_ARN = 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy';
const SERVICE_POLICY_ARN = 'arn:aws:iam::aws:policy/AmazonEKSServicePolicy';

const IAM_ROLE_NAME = 'iamRoleName';
const VPC_STACK_NAME = 'stackName';
const CLUSTER_NAME = 'clusterName';


const VPC_ID = 'vpcId';
const SECURITY_GROUP_IDS = 'securityGroupIds';

const SUBNET_IDS_STRING = 'subnetIdsString';
const SUBNET_IDS_ARRAY = 'subnetIdsArray';

// KUBECONFIG_FILE_STATUS = 'KubeConfigFileStatus';
const KUBECONFIG_FILE_STATUS_CREATED = 'Created';

const KUBECTL_CONFIG_STATUS_CONFIGURED = 'Configured';


const WORKER_NODE_STACK_NAME = 'workerNodeStackName';
const EC2_KEY_PAIR = 'KeyName';

const NODE_INSTANCE = 'nodeInstance';
const NODE_INSTANCE_STATUS_CONFIGURED = 'Created';

// folderName
const KUBE = '.kube';

module.exports = {
  AWS_CREDENTIALS_STATUS,
  AWS_CREDENTIALS_STATUS_CONFIGURED,
  CREATED,
  CREATING,
  ERROR,
  IAM_ROLE_STATUS,
  VPC_STACK_STATUS,
  CLUSTER_STATUS,
  WORKER_NODE_STATUS,
  KUBECTL_CONFIG_STATUS,
  ERROR_MESSAGE,
  CLUSTER_POLICY_ARN,
  IAM_ROLE_NAME,
  VPC_STACK_NAME,
  CLUSTER_NAME,
  VPC_ID,
  SECURITY_GROUP_IDS,
  SUBNET_IDS_STRING,
  SUBNET_IDS_ARRAY,
  KUBECONFIG_FILE_STATUS_CREATED,
  KUBECTL_CONFIG_STATUS_CONFIGURED,
  WORKER_NODE_STACK_NAME,
  EC2_KEY_PAIR,
  NODE_INSTANCE,
  NODE_INSTANCE_STATUS_CONFIGURED,
  KUBE,
};
