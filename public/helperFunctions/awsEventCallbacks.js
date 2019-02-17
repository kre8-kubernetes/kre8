const awsHelperFunctions = require(__dirname + '/awsHelperFunctions'); 
const awsParameters = require(__dirname + '/awsParameters'); 

const EKS = require('aws-sdk/clients/eks');
const IAM = require('aws-sdk/clients/iam');
const CloudFormation = require('aws-sdk/clients/cloudformation');

const fs = require('fs');
const { spawn } = require('child_process');
const fsp = require('fs').promises;


//**.ENV Variables */
const REGION = process.env.REGION;
const SERVICEROLEARN = process.env.EKSSERVICEROLEARN;
const ADRIANEKSSERVICEROLEARN = process.env.ADRIANEKSSERVICEROLEARN;


const SUBNETID1 = process.env.SUBNETID1;
const SUBNETID2 = process.env.SUBNETID2;
const SUBNETID3 = process.env.SUBNETID3;
const SUBNETIDS = [SUBNETID1, SUBNETID2, SUBNETID3];
const SECURITYGROUPIDS = process.env.SECURITYGROUPIDS;

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

};

//** --------- CREATE AWS TECH STACK + SAVE RETURNED DATA IN FILE ----- **//
awsEventCallbacks.createTechStackAndSaveReturnedDataInFile = async (stackName, stackTemplateStringified) => {
  const techStackParam = awsParameters.createTechStackParam(stackName, stackTemplateStringified); 

  //Send tech stack data to AWS to create stack 
  try {
    const stack = await cloudformation.createStack(techStackParam).promise();

    const getStackDataParam = {
      StackName: stackName
    };

    let stringifiedStackData;
    let parsedStackData;
    let stackStatus = "CREATE_IN_PROGRESS";

    //TODO modularize functions
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

    //Send a request to AWS to confirm stack creation and get data*/
    //const describleStack = await cloudformation.describeStacks(params).promise();

    //Stringify the data returned from AWS and save it in a file with the title of the stack name and save in the Assets folder
    // let stringifiedReturnedData = JSON.stringify(describleStack.Stacks);

    // fsp.writeFile(__dirname + `/sdkAssets/private/${stackName}.json`, stringifiedReturnedData);
  } catch (err) {
    console.log(err);
  }

  //TODO Decide what to return to user
  return stackName;
};

//** --------- CREATE AWS CLUSTER ------------------------------------- **//

awsEventCallbacks.createClusterAndSaveReturnedDataToFile = async (clusterName) => {

  //Collect form data, input by the user when creating a Cluster, and insert into clusterParams object
  let stackName = "real";
  
  const stackDataFileContents = fs.readFileSync(__dirname + `/../sdkAssets/private/STACK_${stackName}.json`, 'utf-8');

  // console.log("stackDataFileContents: ", stackDataFileContents);

  const parsedStackDataFileContents = JSON.parse(stackDataFileContents);

  // console.log("parsedStackDataFileContents: ", parsedStackDataFileContents[0]);
  // console.log("parsedStackDataFileContents Outputs: ", parsedStackDataFileContents[0].Outputs);
  console.log("parsedStackDataFileContents Outputs 1: ", parsedStackDataFileContents[0].Outputs[1].OutputValue);
  console.log("parsedStackDataFileContents Outputs 2: ", parsedStackDataFileContents[0].Outputs[2].OutputValue);
  console.log("stackId: ", parsedStackDataFileContents[0].StackId);
  
  //Gather required data from Cluster File
  const subnetIds = [parsedStackDataFileContents[0].Outputs[2].OutputValue];
  const securityGroupIds = parsedStackDataFileContents[0].Outputs[1].OutputValue;
  const roleArn = ADRIANEKSSERVICEROLEARN;
  //parsedStackDataFileContents[0].StackId;

  console.log("subnetIds: ", subnetIds);

  const clusterParam = awsParameters.createClusterParam(clusterName, subnetIds, securityGroupIds, roleArn); 

  try {
    //Send cluster data to AWS via clusterParmas to create a cluster */
    const cluster = await eks.createCluster(clusterParam).promise();
    
    const fetchClusterDataParam = {
      name: clusterName
    };

    let parsedClusterData;
    let status = "CREATING";

    const getClusterData = async () => {
      const clusterData = await eks.describeCluster(fetchClusterDataParam).promise();
      const stringifiedClusterData = JSON.stringify(clusterData, null, 2);
      parsedClusterData = JSON.parse(stringifiedClusterData);
      status = parsedClusterData.cluster.status;
    }

    await timeout(1000 * 60 * 6);
    getClusterData();

    while (status !== "ACTIVE") {
      // wait 30 seconds
      await timeout(1000 * 30)
      getClusterData();
    }

    // await new Promise((resolve, reject) => {
    //   setTimeout(() => {
    //     getClusterData();
    //     resolve();
    //   }, 1000 * 60 * 6);
    // })

    // await new Promise((resolve, reject) => {
    //   const loop = () => {
    //     if (status !== "ACTIVE") {
    //       setTimeout(() => {
    //         getClusterData();
    //         loop();
    //       }, 1000 * 30);
    //     } else {
    //       resolve();
    //     }
    //   } 
    //   loop();  
    // })
        
    const createClusterFile = await fsp.writeFile(__dirname + `/../sdkAssets/private/CLUSTER_${clusterName}.json`, stringifiedClusterData);

  } catch (err) {
    console.log("err", err);
  }

  return clusterName;

};









//**--------- GENERATE AND SAVE CONFIG FILE ON USER COMPUTER ------------- **//

awsEventCallbacks.CREATE_CONFIG_FILE = (clusterName) => {

  //Access data from cluster data file, saved as cluster name, in Assets and save in variables to pass to the AWSConfigFileData object*/

  const clusterDataFileContents = fs.readFileSync(__dirname + `/sdkAssets/private/${clusterName}.js`, 'utf-8');

  const parsedclusterDataFileContents = JSON.parse(clusterDataFileContents);
  
  //Gather required data from Cluster File
  const serverEndpoint = parsedclusterDataFileContents.cluster.endpoint;
  const clusterArn = parsedclusterDataFileContents.cluster.arn;
  const certificateAuthorityData = parsedclusterDataFileContents.cluster.certificateAuthority.data;

  const AWSClusterConfigFileData = awsParameters.createConfigParam(clusterName, serverEndpoint, certificateAuthorityData, clusterArn);
  
  //** Format data from the AWSClusterConfigFileData object into YAML to save in user's filesystem 
  let stringifiedAWSClusterConfigFile = JSON.stringify(AWSClusterConfigFileData);
  let parsedAWSClusterConfigFile = JSON.parse(stringifiedAWSClusterConfigFile);
  let yamledAWSClusterConfigFile = YAML.stringify(parsedAWSClusterConfigFile, 6);
  let regexCharToRemove = /(['])+/g;
  let yamledAWSClusterConfigFileWithoutRegex = yamledAWSClusterConfigFile.replace(regexCharToRemove, "");

  //check if user has a .kube file in their root directory, and if not, make one
  awsHelperFunctions.checkFileSystemForDirectoryAndMkDir(kube);

  //Save file in users .kube file
  fs.writeFileSync(`/Users/carolynharrold/.kube/{clusterName}`, yamledAWSClusterConfigFileWithoutRegex);

};


module.exports = awsEventCallbacks;