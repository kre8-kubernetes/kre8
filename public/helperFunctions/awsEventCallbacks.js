const awsHelperFunctions = require(__dirname + '/awsHelperFunctions'); 
const awsParameters = require(__dirname + '/awsParameters');
const kubectlConfigFunctions = require(__dirname + '/awsConfigureKubectlFunctions');


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

  const iamParams = awsParameters.createIAMRoleParam(roleName, roleDescription, iamRolePolicyDoc);

  //Send IAM data to AWS via the iamParams object to create an IAM Role*/
  try {
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

    //TODO: BRADON: PROMISE ALL INSTEAD
  
  } catch (err) {
    console.log(err);
  }

  return roleName;
};

//** --------- CREATE AWS TECH STACK + SAVE RETURNED DATA IN FILE ----- **//
awsEventCallbacks.createTechStackAndSaveReturnedDataInFile = async (stackName, stackTemplateStringified) => {
  const techStackParam = awsParameters.createTechStackParam(stackName, stackTemplateStringified); 

  try {

    //Send tech stack data to AWS to create stack 
    const stack = await cloudformation.createStack(techStackParam).promise();

    const getStackDataParam = { StackName: stackName };

    let stringifiedStackData;
    let parsedStackData;
    let stackStatus = "CREATE_IN_PROGRESS";

    //TODO modularize function
    const getStackData = async () => {
      try {
        const stackData = await cloudformation.describeStacks(getStackDataParam).promise();
        stringifiedStackData = JSON.stringify(stackData.Stacks, null, 2);
        parsedStackData = JSON.parse(stringifiedStackData);
        stackStatus = parsedStackData[0].StackStatus;
      } catch (err) {
      }
    }
    
    //check with AWS to see if the stack has been created, if so, move on. If not, keep checking until complete. Estimated to take 1 - 1.5 mins.
    while (stackStatus !== "CREATE_COMPLETE") {
      console.log("stackStatus in while loop: ", stackStatus);
      // wait 30 seconds
      await awsHelperFunctions.timeout(1000 * 30)
      getStackData();
    }

    const createStackFile = fsp.writeFile(__dirname + `/../sdkAssets/private/STACK_${stackName}.json`, stringifiedStackData);

  } catch (err) {
    console.log(err);
  }

  //TODO Decide what to return to user
  return stackName;
};

//** --------- CREATE AWS CLUSTER ------------------------------------- **//

awsEventCallbacks.createClusterAndSaveReturnedDataToFile = async (techStackName, roleArn, clusterName) => {

  const stackDataFileContents = fs.readFileSync(__dirname + `/../sdkAssets/private/STACK_${techStackName}.json`, 'utf-8');

  const parsedStackDataFileContents = JSON.parse(stackDataFileContents);
  const subnetIds = parsedStackDataFileContents[0].Outputs[2].OutputValue;
  const subnetArray = subnetIds.split(',');
  const securityGroupIds = parsedStackDataFileContents[0].Outputs[0].OutputValue;

  //TODO: Dynamically grab roleArn
  //const roleArn = ?;

  const clusterParam = awsParameters.createClusterParam(clusterName, subnetArray, securityGroupIds, roleArn); 

  try {
    //Send cluster data to AWS via clusterParmas to create a cluster */
    const cluster = await eks.createCluster(clusterParam).promise();
    
    const fetchClusterDataParam = { name: clusterName };

    let parsedClusterData;
    let stringifiedClusterData;
    let clusterCreationStatus = "CREATING";

    const getClusterData = async () => {
      const clusterData = await eks.describeCluster(fetchClusterDataParam).promise();
      stringifiedClusterData = JSON.stringify(clusterData, null, 2);
      parsedClusterData = JSON.parse(stringifiedClusterData);
      clusterCreationStatus = parsedClusterData.cluster.status;
      console.log("status in getClusterData: ", clusterCreationStatus);
    }

    await awsHelperFunctions.timeout(1000 * 60 * 6);
    getClusterData();

    while (clusterCreationStatus !== "ACTIVE") {
      // wait 30 seconds
      await awsHelperFunctions.timeout(1000 * 30)
      getClusterData();
    }
        
    const createClusterFile = await fsp.writeFile(__dirname + `/../sdkAssets/private/CLUSTER_${clusterName}.json`, stringifiedClusterData);

    await kubectlConfigFunctions.createConfigFile(clusterName);
    await kubectlConfigFunctions.configureKubectl(clusterName);
    await kubectlConfigFunctions.createStackForWorkerNode(stackName, clusterName);







  } catch (err) {
    console.log("err", err);
  }






  return clusterName;
};










module.exports = awsEventCallbacks;