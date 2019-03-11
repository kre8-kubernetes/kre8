const awsPropertyNames = {};

awsPropertyNames.AWS_CREDENTIALS_STATUS = "STATUS";
awsPropertyNames.AWS_CREDENTIALS_STATUS_CONFIGURED = "CONFIGURED";

awsPropertyNames.CREATED = 'CREATED';
awsPropertyNames.IAM_ROLE_STATUS = 'iamRoleStatus';
awsPropertyNames.VPC_STACK_STATUS = 'stackStatus';
awsPropertyNames.CLUSTER_STATUS = 'clusterStatus';
awsPropertyNames.WORKER_NODE_STATUS = 'workerNodeStatus';
awsPropertyNames.KUBECTL_CONFIG_STATUS = 'kubectlConfigStatus';
awsPropertyNames.ERROR_MESSAGE = 'errorMessage';

awsPropertyNames.CLUSTER_POLICY_ARN = 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy';
awsPropertyNames.SERVICE_POLICY_ARN = 'arn:aws:iam::aws:policy/AmazonEKSServicePolicy';

awsPropertyNames.IAM_ROLE_NAME = 'iamRoleName';
awsPropertyNames.VPC_STACK_NAME = 'stackName';
awsPropertyNames.CLUSTER_NAME = 'clusterName';


awsPropertyNames.VPC_ID = 'vpcId';
awsPropertyNames.SECURITY_GROUP_IDS = 'securityGroupIds';

awsPropertyNames.SUBNET_IDS_STRING = 'subnetIdsString';
awsPropertyNames.SUBNET_IDS_ARRAY = 'subnetIdsArray';

awsPropertyNames.KUBECONFIG_FILE_STATUS = "KubeConfigFileStatus";
awsPropertyNames.KUBECONFIG_FILE_STATUS_CREATED = "Created";

awsPropertyNames.KUBECTL_CONFIG_STATUS = "KubectlConfigStatus";
awsPropertyNames.KUBECTL_CONFIG_STATUS_CONFIGURED = "Configured";


awsPropertyNames.WORKER_NODE_STACK_NAME = "workerNodeStackName";
awsPropertyNames.EC2_KEY_PAIR = "KeyName";

awsPropertyNames.NODE_INSTANCE = "nodeInstance";
awsPropertyNames.NODE_INSTANCE_STATUS_CONFIGURED = "Created";

//folderName
awsPropertyNames.KUBE = ".kube";



module.exports = awsPropertyNames;