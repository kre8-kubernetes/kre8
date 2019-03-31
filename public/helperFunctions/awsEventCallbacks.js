//* --------- NODE APIS ---------------- 
const fs = require('fs');
const fsp = require('fs').promises;
const mkdirp = require('mkdirp');

//* --------- AWS SDK ELEMENTS --------- 
const EKS = require('aws-sdk/clients/eks');
const IAM = require('aws-sdk/clients/iam');
const CloudFormation = require('aws-sdk/clients/cloudformation');

//* --------- INSTANTIATE AWS CLASSES --- 
const iam = new IAM();
const eks = new EKS({ region: process.env.REGION });
const cloudformation = new CloudFormation({ region: process.env.REGION });

//* --------- IMPORT MODULES ----------- 
const onDownload = require(__dirname + '/onDownloadFunctions');
const awsHelperFunctions = require(__dirname + '/awsHelperFunctions'); 
const awsParameters = require(__dirname + '/awsParameters');
const awsProps = require(__dirname + '/../awsPropertyNames'); 
const kubectlConfigFunctions = require(__dirname + '/kubectlConfigFunctions');

//* --------- IMPORT DOCUMENT TEMPLATES - 
const iamRolePolicyDocument = require(__dirname + '/../Storage/AWS_Assets/Policy_Documents/iamRoleTrustPolicy.json');
const stackTemplate = require(__dirname + '/../Storage/AWS_Assets/Policy_Documents/amazon-stack-template-eks-vpc-real.json');

//* --------- DECLARE EXPORT OBJECT ---------------------------------- 
const awsEventCallbacks = {};

//* --------- EXECUTES ON DOWNLOAD -------------------------------------------- *//
//* --------- Check for & install aws-iam-authenticator ----------------------- *//

/*
* To communicate with AWS, user must have the aws-iam-authenticator installed
* These functions check if authenticator is already installed in user's bin folder
* If not, the authenticator will be installed, and the path will be defined in the user's 
* .bash_profile file, which is where AWS specifies it should be
*/

awsEventCallbacks.installAndConfigureAWS_IAM_Authenticator = async () => {

  try {
    const iamAuthenticatorExists = fs.existsSync(process.env['HOME'] + '/bin/aws-iam-authenticator');

    if (!iamAuthenticatorExists) {
      onDownload.installIAMAuthenticator();
      onDownload.enableIAMAuthenticator();
      onDownload.copyIAMAuthenticatorToBinFolder();
    }
    await onDownload.setPATHAndAppendToBashProfile();
  } catch (err) {
    throw err;
  }
};

awsEventCallbacks.setEnvVarsAndMkDirsInDev = () => {
  process.env['AWS_STORAGE'] = process.env['APPLICATION_PATH'] + '/Storage/AWS_Assets/';
  process.env['KUBECTL_STORAGE'] = process.env['APPLICATION_PATH'] + '/Storage/KUBECTL_Assets/'
  mkdirp.sync(process.env['AWS_STORAGE'] + 'AWS_Private/');
  mkdirp.sync(process.env['KUBECTL_STORAGE']);
};


awsEventCallbacks.setEnvVarsAndMkDirsInProd = () => {
  process.env['APPLICATION_PATH'] = process.env['HOME'] + '/Library/Application\ Support/KRE8';
  process.env['AWS_STORAGE'] = process.env['APPLICATION_PATH'] + `/Storage/AWS_Assets/`;
  process.env['KUBECTL_STORAGE'] = process.env['APPLICATION_PATH'] + '/Storage/KUBECTL_Assets'
  mkdirp.sync(process.env['AWS_STORAGE'] + 'AWS_Assets/');
  mkdirp.sync(process.env['KUBECTL_STORAGE']);
};


//* ------- EXECUTES ON EVERY OPENING OF APPLICATION --------------- *//
//* ------- Check credentials file to determine if user needs to configure the application **// 
awsEventCallbacks.returnKubectlAndCredentialsStatus = async (data) => {

  try {

    const kubectlStatus = await kubectlConfigFunctions.testKubectlStatus();

    const awsCredentialFileExists = fs.existsSync(process.env['AWS_STORAGE'] + 'AWS_Private/awsCredentials.json');

    console.log('kubectlStatus: ', kubectlStatus)
    console.log('awsCredentialFileExists: ', awsCredentialFileExists)


    if ((kubectlStatus === true) &&  awsCredentialFileExists) {

      const readAWSCredentialsFile = await fsp.readFile(process.env['AWS_STORAGE'] + 'AWS_Private/awsCredentials.json', 'utf-8');

      const parsedCredentialsFile = JSON.parse(readAWSCredentialsFile);
      console.log('this is the parsed obj', parsedCredentialsFile);
      console.log('STATUS!!!!!!', parsedCredentialsFile.STATUS);

      return (parsedCredentialsFile.STATUS === awsProps.AWS_CREDENTIALS_STATUS_CONFIGURED) ? true : false;
    } else {
      return false;
    }

    } catch (err) {
      console.log(err);
      return false;
    }
}

//* --------- CONFIGURE AWS CREDENTIALS ------------------------------ *//
//Check if awsCredentials.json file exits, meaning user has configured KRE8 application
//previously. If not, create the file, adding user input, and setting environment variables for
//AWS credentials and region.
awsEventCallbacks.configureAWSCredentials = async (data) => {

  if (fs.existsSync(process.env['AWS_STORAGE'] + 'AWS_Private/awsCredentials.json')) {

    const awsCredentialsFile = await fsp.readFile(process.env['AWS_STORAGE'] + 'AWS_Private/awsCredentials.json', 'utf-8');
    const parsedCredentialsFile = JSON.parse(awsCredentialsFile);
    console.log('Credential file this is the parsed obj', parsedCredentialsFile);

    parsedCredentialsFile.AWS_ACCESS_KEY_ID = data.awsAccessKeyId;
    parsedCredentialsFile.AWS_SECRET_ACCESS_KEY = data.awsSecretAccessKey;
    parsedCredentialsFile.REGION = data.awsRegion;

    process.env['AWS_ACCESS_KEY_ID'] = data.awsAccessKeyId;
    process.env['AWS_SECRET_ACCESS_KEY'] = data.awsSecretAccessKey;
    process.env['REGION'] = data.awsRegion;

    console.log('environment variables: ', process.env['AWS_ACCESS_KEY_ID'], process.env['AWS_SECRET_ACCESS_KEY'],  process.env['REGION'] )

    const stringifiedCredentialFile = JSON.stringify(parsedCredentialsFile, null, 2);
    await fsp.writeFile(process.env['AWS_STORAGE'] + 'AWS_Private/awsCredentials.json', stringifiedCredentialFile);

  } else {
    process.env['AWS_ACCESS_KEY_ID'] = data.awsAccessKeyId;
    process.env['AWS_SECRET_ACCESS_KEY'] = data.awsSecretAccessKey;
    process.env['REGION'] = data.awsRegion;

    console.log('environment variables: ', process.env['AWS_ACCESS_KEY_ID'], process.env['AWS_SECRET_ACCESS_KEY'],  process.env['REGION'] )

    const dataForCredentialsFile = {
      AWS_ACCESS_KEY_ID: data.awsAccessKeyId,
      AWS_SECRET_ACCESS_KEY: data.awsSecretAccessKey,
      REGION: data.awsRegion
    };

    const stringifiedCredentialFile = JSON.stringify(dataForCredentialsFile, null, 2);

    await fsp.writeFile(process.env['AWS_STORAGE'] + 'AWS_Private/awsCredentials.json', stringifiedCredentialFile);

  }
}

//* --------- CREATE AWS IAM ROLE + ATTACH POLICY DOCS --------------- *//
//Check if the user has already created an IAM role by this name. If not, send IAM data to 
//AWS via the iamParams object to create an IAM Role, and save the data to the file.
//After role is created, send Cluster + Service Policies to AWS to grant IAM Role
//permission to operate cluster
/**
 * @param {Object} data
 * @param {Object} iamRolePolicyDoc this is a JSON object that has been required in main.js
 */
awsEventCallbacks.createIAMRole = async (iamRoleName) => {

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('================  awsEventCallbacks.createIAMRole ===================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    const isIAMRoleNameInMasterFile = await awsHelperFunctions.checkAWSMasterFile(awsProps.IAM_ROLE_NAME, iamRoleName);

    console.log('isIAMRoleNameInMasterFile: ', isIAMRoleNameInMasterFile);

    if (!isIAMRoleNameInMasterFile) {
      const iamParams = awsParameters.createIAMRoleParam(iamRoleName, iamRolePolicyDocument);
      const iamRoleDataReturnedFromAWS = await iam.createRole(iamParams).promise();

      //TODO: handle error info from AWS
      if (iamRoleDataReturnedFromAWS.Role.CreateDate) {
        console.log('Data that comes back from AWS after creating a role', iamRoleDataReturnedFromAWS);

        const iamRoleData = {
          createDate: iamRoleDataReturnedFromAWS.Role.CreateDate,
          iamRoleName: iamRoleDataReturnedFromAWS.Role.RoleName,
          iamRoleArn: iamRoleDataReturnedFromAWS.Role.Arn,
        }

        await awsHelperFunctions.appendAWSMasterFile(iamRoleData);

        const clusterPolicyParam = { RoleName: iamRoleName, PolicyArn: awsProps.CLUSTER_POLICY_ARN };
        const servicePolicyParam = { RoleName: iamRoleName, PolicyArn: awsProps.SERVICE_POLICY_ARN };
        await Promise.all([
          iam.attachRolePolicy(clusterPolicyParam).promise(), 
          iam.attachRolePolicy(servicePolicyParam).promise()
        ])

        return `AWS IAM Role ${iamRoleName} created with the Role ARN ${iamRoleData.iamRoleArn}.`

      } else {
        console.log('Error in creating IAM role: ', iamRoleDataReturnedFromAWS);
        throw iamRoleDataReturnedFromAWS;
      }

    } else {
      console.log('AWS IAM Role already exists.');
      return `AWS IAM Role with the name ${iamRoleName} already exists. Continuing with the creation process, and attaching elements to ${iamRoleName} IAM Role.`;
    }

  } catch (err) {
    console.log('Error from awsEventCallbacks.createIAMROle:', err);
    throw `${err}`;
  }
};


//* --------- CREATE AWS STACK ------------------------------------ *//
/**
 * @param {String} stackName
 * @param {String} iamRoleName
 */
awsEventCallbacks.createVPCStack = async (stackName, iamRoleName) => {


  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('================  awsEventCallbacks.createVPCStack =================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    const isVPCStackInMasterFile = await awsHelperFunctions.checkAWSMasterFile(awsProps.VPC_STACK_NAME, stackName);

    console.log('isVPCStackInMasterFile: ', isVPCStackInMasterFile);

    let parsedStackData;

    if (!isVPCStackInMasterFile) {

      const vpcStackParam = await awsParameters.createVPCStackParam(stackName, stackTemplate); 

      // Send tech stack data to AWS to create stack

      await cloudformation.createStack(vpcStackParam).promise();


      let stringifiedStackData;

      let stackStatus = 'CREATE_IN_PROGRESS';

      const getStackDataParam = { StackName: stackName };
      const getStackData = async () => {
        try {
          
          const stackData = await cloudformation.describeStacks(getStackDataParam).promise();
          stringifiedStackData = JSON.stringify(stackData.Stacks, null, 2);
          parsedStackData = JSON.parse(stringifiedStackData);
          stackStatus = parsedStackData[0].StackStatus;
        } catch (err) {
          console.log(err);
          throw `${err}`;
        }
      }
    
    //check with AWS to see if the stack has been created, if so, move on. If not, keep checking until complete. Estimated to take 1 - 1.5 mins.
      while (stackStatus === 'CREATE_IN_PROGRESS') {
        console.log('stackStatus in while loop: ', stackStatus);
        // wait 30 seconds before rerunning function
        await awsHelperFunctions.timeout(1000 * 30)
        getStackData();
      }

      if (stackStatus === 'CREATE_COMPLETE') {        
        
        const stackDataForMasterFile = {
          stackName: parsedStackData[0].StackName,
          vpcId: parsedStackData[0].Outputs[1].OutputValue,
          subnetIdsString: parsedStackData[0].Outputs[2].OutputValue,
          securityGroupIds: parsedStackData[0].Outputs[0].OutputValue
        }
        stackDataForMasterFile.subnetIdsArray = stackDataForMasterFile.subnetIdsString.split(',');

        await awsHelperFunctions.appendAWSMasterFile(stackDataForMasterFile);

      } else {
        console.log(`Error in creating stack. Stack Status = ${stackStatus}`);
        throw `Stack Status: ${stackStatus}`;

      }

      return `AWS Stack ${stackName} created.`

    } else {
      console.log('Stack already exists');
      return `AWS Stack with the name ${stackName} already exists. Continuing with the creation process, and attaching elements to ${stackName} stack.`;

    }

  } catch (err) {
    console.log('Error from awsEventCallbacks.createTechStack:', err);
    throw `${err}`;
  }
};

//** --------- CREATE AWS CLUSTER ------------------------------------- **//

//TODO, removed iamRolName from param 
awsEventCallbacks.createCluster = async (clusterName) => {
  
  console.log('ClusterCreating: ', clusterName);
  //TODO: do we actually need to declare all of these here
  let parsedClusterData;
  let iamRoleArn;
  let subnetIdsString;
  let subnetIdsArray;
  let securityGroupIds;
  let vpcId;

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('=================  awsEventCallbacks.createCluster ==================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    
    //Check if cluster has been created
    const isClusterInMasterFile = await awsHelperFunctions.checkAWSMasterFile(awsProps.CLUSTER_NAME, clusterName);

    console.log('isClusterInMasterFile: ', isClusterInMasterFile);

    if (!isClusterInMasterFile) {

      const awsMasterFileData = fs.readFileSync(process.env['AWS_STORAGE'] + `AWS_Private/${process.env['CLUSTER_NAME']}_MASTER_FILE.json`, 'utf-8');

      const parsedAWSMasterFileData = JSON.parse(awsMasterFileData);
      iamRoleArn = parsedAWSMasterFileData.iamRoleArn;
      subnetIdsString = parsedAWSMasterFileData.subnetIdsString;
      subnetIdsArray = parsedAWSMasterFileData.subnetIdsArray;
      securityGroupIds = parsedAWSMasterFileData.securityGroupIds;
      vpcId = parsedAWSMasterFileData.vpcId;

      const clusterParam = awsParameters.createClusterParam(clusterName, subnetIdsArray, securityGroupIds, iamRoleArn);

      // Send cluster data to AWS via clusterParmas to create a cluster 
      await eks.createCluster(clusterParam).promise();
        
      const getClusterDataParam = { name: clusterName };

      let stringifiedClusterData;
      let clusterCreationStatus = 'CREATING';

      // Request cluster data from AWS and check cluster creation status
      const getClusterData = async () => {
        try {
          const clusterData = await eks.describeCluster(getClusterDataParam).promise();
          stringifiedClusterData = JSON.stringify(clusterData, null, 2);
          parsedClusterData = JSON.parse(stringifiedClusterData);
          clusterCreationStatus = parsedClusterData.cluster.status;
          
          console.log('status in getClusterData: ', clusterCreationStatus);
        } catch (err) {
          console.log('Error from the getClusterData function from within awsEventCallbacks.createCluster:', err);

          throw `${err}`;

        }
      }
      
      console.log('6 min settimeout starting');
      //Timeout execution thread for 6 minutes to give AWS time to create cluster
      await awsHelperFunctions.timeout(1000 * 60 * 6);

      // Ask Amazon for cluster data
      getClusterData();

      while (clusterCreationStatus === 'CREATING') {
        //Timeout execution thread for 30 seconds before resending request to AWS for cluster data
        await awsHelperFunctions.timeout(1000 * 30)
        getClusterData();
      }

      // Once Cluster is created:
      if (clusterCreationStatus === 'ACTIVE') {
        console.log('parsedClusterData: ', parsedClusterData)

        //Append relavant cluster data to AWS_MASTER_DATA file
        clusterDataforMasterFile = {
          clusterName: parsedClusterData.cluster.name,
          clusterArn: parsedClusterData.cluster.arn,
          serverEndPoint: parsedClusterData.cluster.endpoint,
          certificateAuthorityData: parsedClusterData.cluster.certificateAuthority.data,
        }
        
        await awsHelperFunctions.appendAWSMasterFile(clusterDataforMasterFile);

        console.log('Cluster created');
        return `AWS Cluster ${clusterName} created.`
      } else {
        console.log(`Error in creating cluster. Cluster Status = ${clusterStatus}`);
        throw `Cluster Status: ${clusterStatus}`;

      }

    } else {
      console.log('Cluster already exists');
      return `AWS Cluster with the name ${clusterName} already exists. Continuing with the creation process, and attaching elements to ${clusterName} cluster.`;
    }

  } catch (err) {
    console.log('Error from awsEventCallbacks.createCluster: ', err);
    throw `${err}`;
  }
};

module.exports = awsEventCallbacks;
