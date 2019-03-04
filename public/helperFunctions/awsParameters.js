//** --------- NODE APIS ---------------- 
const fs = require('fs');
const fsp = require('fs').promises;

//** --------- DECLARE EXPORT OBJECT ---------------------------------- 
const awsParameters = {};

//** --------- GENERATES PARAMETER FOR CREATING IAM ROLE--------------- **//
/** Parameter for CREATE_IAM_ROLE 
 * @param {String} rolename
 * @param {Object} iamRolePolicyDocumen JSON object for the IAM role policy 
 */
awsParameters.createIAMRoleParam = (roleName, iamRolePolicyDocument) => {
  const iamRoleParam = {
    AssumeRolePolicyDocument: JSON.stringify(iamRolePolicyDocument),
    RoleName: roleName,
    Path: '/', 
  };
  return iamRoleParam;
}

//** --------- GENERATES PARAMETER FOR CREATING TECH STACK-------------- **//
/** Parameter for CREATE_TECH_STACK 
 * @param {String} stackName
 * @param {String} stackTemplate 
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

//** --------- GENERATES PARAMETER FOR CREATING CLUSTER -------------- **//
/** Parameter for CREATING CLUSTER 
 * @param {String} clusterName
 * @param {Array} subnetIds 
 * @param {String} securityGroupIds 
 * @param {String} roleArn 
 */

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

//** --------- GENERATES PARAMETER FOR CREATE_CONFIG_FILE -------------- **//
/** Parameter for CREATE_CONFIG_FILE 
 * @param {String} clusterName
 * @param {String} serverEndpoint 
 * @param {String} certificateAuthorityData 
 */

awsParameters.createConfigParam = (clusterName, serverEndpoint, certificateAuthorityData) => {
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

//** --------- GENERATES PARAMETER FOR CREATE_WORKER_NODE_TECH_STACK -------------- **//
/** Parameter for CREATE_CONFIG_FILE 
 * @param {String} iamRoleName
 * @param {String} workerNodeStackName 
 * @param {String} stackTemplateforWorkerNode 
 */

awsParameters.createWorkerNodeStackParam = (iamRoleName, workerNodeStackName, stackTemplateforWorkerNode) => {

  console.log("CREATNG STACK PARAM");

  const awsMasterFileData = fs.readFileSync(process.env['AWS_STORAGE'] + `${iamRoleName}_MASTER_FILE.json`, 'utf-8');

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
    TemplateBody: JSON.stringify(stackTemplateforWorkerNode),
  }
  return workerNodeStackParam;
}

module.exports = awsParameters;
