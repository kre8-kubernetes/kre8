const fs = require('fs');
const fsp = require('fs').promises;
const awsParameters = {};

/** Parameter for CREATE_IAM_ROLE 
 * @param {String} rolename
 * @param {Object} iamRolePolicyDocument This is the JSON object for the IAM role policy 
 */
awsParameters.createIAMRoleParam = (roleName, iamRolePolicyDocument) => {
  const iamRoleParam = {
    AssumeRolePolicyDocument: JSON.stringify(iamRolePolicyDocument),
    RoleName: roleName,
    Path: '/', 
  };
  return iamRoleParam;
}

/** Parameter for CREATE_TECH_STACK 
 * @param {String} stackName
 * @param {String} stackTemplate this has already been stringified
 */
awsParameters.createVPCStackParam = (vpcStackName, stackTemplate) => {
  const vpcStackParam = {
    StackName: vpcStackName,
    DisableRollback: false,
    EnableTerminationProtection: false,
    Parameters: [
      { ParameterKey: 'VpcBlock', ParameterValue: '192.168.0.0/16', },
      { ParameterKey: 'Subnet01Block', ParameterValue: '192.168.64.0/18', },
      { ParameterKey: 'Subnet02Block', ParameterValue: '192.168.128.0/18', },
      { ParameterKey: 'Subnet03Block', ParameterValue: '192.168.192.0/18', }
    ],
    TemplateBody: JSON.stringify(stackTemplate),
  };
  return vpcStackParam;
}

//** Parameter for CREATE_CLUSTER 
awsParameters.createClusterParam = (clusterName, subnetIds, securityGroupIds, roleArn) => {
  const clusterParam = {
    name: clusterName, 
    resourcesVpcConfig: {
      subnetIds: subnetIds,
      securityGroupIds: [
        securityGroupIds
      ]
    },
    roleArn: roleArn, 
  }
  return clusterParam;
}


//** Parameter for CREATE_CONFIG_FILE 
awsParameters.createConfigParam = (clusterName, serverEndpoint, certificateAuthorityData, clusterArn) => {
  const AWSClusterConfigFileParam = {
    "apiVersion": "v1",
    "clusters": [
        { "cluster": { "server": serverEndpoint, "certificate-authority-data": certificateAuthorityData, },
            "name": "kubernetes" },
    ],
    "contexts": [ { "context": { "cluster": "kubernetes", "user": "aws" },
            "name": "aws" }, ],
    "current-context": "aws",
    "kind": "Config",
    "preferences": {},
    "users": [
        {
            "name": "aws",
            "user": {
                "exec": {
                    "apiVersion": "client.authentication.k8s.io/v1alpha1",
                    "command": "aws-iam-authenticator",
                    "args": [ "token", "-i", clusterName ]
                }
            }
        },
    ]
  }
  return AWSClusterConfigFileParam;
}

//** Parameter for CREATE_WORKER_NODE_TECH_STACK 

awsParameters.createWorkerNodeStackParam = (workerNodeStackName, stackTemplateforWorkerNodeStringified) => {

  console.log("CREATNG STACK PARAM");

  const awsMasterFileData = fs.readFileSync(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`, 'utf-8');
  const parsedAWSMasterFileData = JSON.parse(awsMasterFileData);

  console.log('Here is the current master file data in createWorkerNodeStackParams: ', parsedAWSMasterFileData)

  const clusterName = parsedAWSMasterFileData.clusterName;
  const subnetIdsString = parsedAWSMasterFileData.subnetIdsString;
  const vpcId = parsedAWSMasterFileData.vpcId;
  const securityGroupIds = parsedAWSMasterFileData.securityGroupIds;
  const awsKeyValuePairValue = parsedAWSMasterFileData.KeyName;

  //TODO: find a way to continuously get the latest AMI values for eks instances
  // because right now we are hard coding it and the values will change periodically
  // there is probably a way to poll the later values from AWS
  const workerNodeStackParam = {
    StackName: workerNodeStackName,
    Capabilities: [ "CAPABILITY_IAM" ],
    DisableRollback: false,
    EnableTerminationProtection: false,
    Parameters: [
      { "ParameterKey": "ClusterName", "ParameterValue": clusterName },
      { "ParameterKey": "ClusterControlPlaneSecurityGroup", "ParameterValue": securityGroupIds },
      { "ParameterKey": "NodeGroupName", "ParameterValue": "worker-node" },
      { "ParameterKey": "NodeAutoScalingGroupMinSize", "ParameterValue": "1" },
      { "ParameterKey": "NodeAutoScalingGroupDesiredCapacity", "ParameterValue": "3" },
      { "ParameterKey": "NodeAutoScalingGroupMaxSize", "ParameterValue": "4" },
      { "ParameterKey": "NodeInstanceType", "ParameterValue": "t3.nano" },
      { "ParameterKey": "NodeImageId", "ParameterValue": "ami-0c28139856aaf9c3b" },
      { "ParameterKey": "KeyName", "ParameterValue": awsKeyValuePairValue },
      { "ParameterKey": "VpcId", "ParameterValue": vpcId },
      { "ParameterKey": "Subnets", "ParameterValue": subnetIdsString }
    ],
    TemplateBody: stackTemplateforWorkerNodeStringified,
  }
  return workerNodeStackParam;
}

//** Parameter for INPUT NODE INSTANCE 

awsParameters.createInputNodeInstance = (nodeInstanceRoleArn) => {

  const inputNodeInstanceParam = {
    "apiVersion": "v1",
    "kind": "ConfigMap",
    "metadata": {
        "name": "aws-auth",
        "namespace": "kube-system"
    },
    "data": {
      "mapRoles": "- " + nodeInstanceRoleArn +"\n  username: system:node:{{EC2PrivateDNSName}}\n  groups:\n    - system:bootstrappers\n    - system:nodes\n"
    }
}

  console.log("exiting params");
  return inputNodeInstanceParam;
}

module.exports = awsParameters;
