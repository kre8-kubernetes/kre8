const awsHelperFunctions = require(__dirname + '/awsHelperFunctions'); 
const awsParameters = require(__dirname + '/awsParameters');
const kubectlConfigFunctions = require(__dirname + '/kubectlConfigFunctions');


const EKS = require('aws-sdk/clients/eks');
const IAM = require('aws-sdk/clients/iam');
const CloudFormation = require('aws-sdk/clients/cloudformation');

const fs = require('fs');
const { spawn } = require('child_process');
const fsp = require('fs').promises;


//**.ENV Variables */
const REGION = process.env.REGION;

//** --------- INITIALIZE IMPORTS --------- 
const iam = new IAM()
const eks = new EKS({ region: REGION});
const cloudformation = new CloudFormation({ region: REGION});

const awsEventCallbacks = {};

//** --------- CREATE AWS IAM ROLE + ATTACH POLICY DOCS --------------- **//
awsEventCallbacks.createIAMRoleAndCreateFileAndAttachPolicyDocs = async (roleName, roleDescription, iamRolePolicyDoc) => {

  try {
    const iamParams = awsParameters.createIAMRoleParam(roleName, roleDescription, iamRolePolicyDoc);

    //Send IAM data to AWS via the iamParams object to create an IAM Role*/
    const role = await iam.createRole(iamParams).promise();

    //Collect the relevant IAM data returned from AWS
    const iamRoleDataFromForm = {
      roleName: role.Role.RoleName,
      createDate: role.Role.RoleId,
      roleID: role.Role.RoleId,
      arn: role.Role.Arn,
      createDate: role.Role.CreateDate,
      path: role.Role.Path
    }

    const stringifiedIamRoleDataFromForm = JSON.stringify(iamRoleDataFromForm);
    
    //Create file named for IAM Role and save in assets folder */
    fsp.writeFile(__dirname + `/../sdkAssets/private/IAM_ROLE_${roleName}.json`, stringifiedIamRoleDataFromForm);

    //Send Cluster + Service Policies to AWS to attach to created IAM Role 
    const clusterPolicyArn = 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy';
    const servicePolicyArn = 'arn:aws:iam::aws:policy/AmazonEKSServicePolicy';

    const clusterPolicy = {
      RoleName: roleName,
      PolicyArn: clusterPolicyArn
    }

    const servicePolicy = {
      RoleName: roleName,
      PolicyArn: servicePolicyArn
    }

    await iam.attachRolePolicy(clusterPolicy).promise();
    await iam.attachRolePolicy(servicePolicy).promise();

    //TODO: BRADEN: PROMISE ALL INSTEAD
  
  } catch (err) {
    console.log(err);
  }

  return roleName;
};

//** --------- CREATE AWS TECH STACK + SAVE RETURNED DATA IN FILE ----- **//
awsEventCallbacks.createTechStackAndSaveReturnedDataInFile = async (stackName, stackTemplateStringified) => {

  try {

  const techStackParam = await awsParameters.createTechStackParam(stackName, stackTemplateStringified); 
  
  const techStackCreated = await awsHelperFunctions.createTechStack(stackName, techStackParam); 

  } catch (err) { 
    console.log(err); 
  }
};

//** --------- CREATE AWS CLUSTER ------------------------------------- **//

awsEventCallbacks.createClusterAndSaveReturnedDataToFile = async (techStackName, iamRoleName, clusterName) => {

  console.log("ClusterCreating: ", clusterName);

  try {

    const iamRoleFileContents = fs.readFileSync(__dirname + `/../sdkAssets/private/IAM_ROLE_${iamRoleName}.json`, 'utf-8');


    const parsedIamRoleFileContents = JSON.parse(iamRoleFileContents);

    console.log("parsedIamRoleFileContents: ", parsedIamRoleFileContents)

    const roleArn = parsedIamRoleFileContents.arn;
    console.log("roleArn: ", roleArn)

  
    //Get data from tech stack file
    const stackDataFileContents = fs.readFileSync(__dirname + `/../sdkAssets/private/STACK_${techStackName}.json`, 'utf-8');

    const parsedStackDataFileContents = JSON.parse(stackDataFileContents);
    const subnetIds = parsedStackDataFileContents[0].Outputs[2].OutputValue;
    const subnetArray = subnetIds.split(',');
    const securityGroupIds = parsedStackDataFileContents[0].Outputs[0].OutputValue;

    //Use data to generate cluster parameter to send to AWS
    const clusterParam = awsParameters.createClusterParam(clusterName, subnetArray, securityGroupIds, roleArn);

    //Send cluster data to AWS via clusterParmas to create a cluster 
    const cluster = await eks.createCluster(clusterParam).promise();
      

    const fetchClusterDataParam = { name: clusterName };

    let parsedClusterData;
    let stringifiedClusterData;
    let clusterCreationStatus = "CREATING";

    //Function to request cluster data from AWS and check cluster creation status
    const getClusterData = async () => {
      const clusterData = await eks.describeCluster(fetchClusterDataParam).promise();
      stringifiedClusterData = JSON.stringify(clusterData, null, 2);
      parsedClusterData = JSON.parse(stringifiedClusterData);
      clusterCreationStatus = parsedClusterData.cluster.status;
      
      console.log("status in getClusterData: ", clusterCreationStatus);
    }
    
    //Timeout execution thread for 6 minutes to give AWS time to create cluster
    await awsHelperFunctions.timeout(1000 * 60 * 6);
    
    //Ask Amazon for cluster data
    getClusterData();

    while (clusterCreationStatus !== "ACTIVE") {
      //Timeout execution thread for 30 seconds before resending request to AWS for cluster data
      await awsHelperFunctions.timeout(1000 * 30)
      getClusterData();
    }
    
    //Once cluster is created, create a file holding the cluster data from AWS
    const createClusterFile = await fsp.writeFile(__dirname + `/../sdkAssets/private/CLUSTER_${clusterName}.json`, stringifiedClusterData);

    const clusterFileContents = fs.readFileSync(__dirname + `/../sdkAssets/private/CLUSTER_${clusterName}.json`, 'utf-8');

    const parsedClusterFileContents = JSON.parse(clusterFileContents);

    console.log("parsedClusterFileContents: ", parsedClusterFileContents)

    const clusterControlPlaneSecurityGroup = parsedClusterFileContents.cluster.resourcesVpcConfig.securityGroupId[0];
    console.log("clusterControlPlaneSecurityGroup: ", clusterControlPlaneSecurityGroup)
    const vpcId = parsedClusterFileContents.cluster.resourcesVpcConfig.vpcId;
    console.log("vpcId: ", vpcId)
    
    // const subnetIds = 
    // parsedClusterFileContents.cluster.resourcesVpcConfig.subnetIds;
    // console.log("subnetIds: ", subnetIds)
    // const subnetIdsInCorrectFormat = subnetIds.reduce((acc, cv, index, array) => {
    //   if (index !== array.length -1) {
    //     acc += cv + ',';
    //   } else {
    //     acc += cv;
    //   }
    //   return acc;
    // }, '');
    // console.log("subnetIdsInCorrectFormat: ", subnetIdsInCorrectFormat);

    await kubectlConfigFunctions.createConfigFile(clusterName);
    await kubectlConfigFunctions.configureKubectl(clusterName);
    await kubectlConfigFunctions.createStackForWorkerNode(clusterName, subnetIds, vpcId, ClusterControlPlaneSecurityGroup);
    await kubectlConfigFunctions.inputNodeInstance(stackName);
  
  } catch (err) {
    console.log("err", err);
  }

  return clusterName;
};


module.exports = awsEventCallbacks;