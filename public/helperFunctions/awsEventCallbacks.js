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
    fsp.writeFile(__dirname + `/../sdkAssets/private/${roleName}.json`, stringifiedIamRoleDataFromForm);

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
awsEventCallbacks.createTechStackAndSaveReturnedDataInFile = async (roleName, roleDescription, iamRolePolicyDoc) => {





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