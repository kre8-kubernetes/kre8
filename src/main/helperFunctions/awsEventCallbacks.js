// --------- NODE APIS ----------------
const fs = require('fs');
const fsp = require('fs').promises;
const mkdirp = require('mkdirp');

// --------- AWS SDK ELEMENTS ---------
const EKS = require('aws-sdk/clients/eks');
const IAM = require('aws-sdk/clients/iam');
const CloudFormation = require('aws-sdk/clients/cloudformation');

// --------- INSTANTIATE AWS CLASSES ------
const iam = new IAM();
const eks = new EKS({ region: 'us-west-2' });
const cloudformation = new CloudFormation({ region: 'us-west-2' });

// --------- IMPORT MODULES -----------
const {
  installIAMAuthenticator,
  enableIAMAuthenticator,
  setPATHAndAppendToBashProfile,
} = require(__dirname + '/onDownloadFunctions');

const { timeout } = require('../utils/async');

const {
  checkAWSMasterFile,
  appendAWSMasterFile,
} = require(__dirname + '/awsHelperFunctions'); 

const {
  createIAMRoleParam,
  createVPCStackParam,
  createClusterParam,
} = require(__dirname + '/awsParameters');

const awsProps = require(__dirname + '/../awsPropertyNames'); 
const { testKubectlStatus } = require(__dirname + '/kubectlConfigFunctions');

const {
  logWithLabel,
  logLabeledError,
  logError,
  logStep,
} = require('../utils');

// --------- DOCUMENT TEMPLATES -------

// TODO (braden): these are pretty gross paths. Need to clean up.
const iamRolePolicyDocument = require(__dirname + '/../Storage/AWS_Assets/Policy_Documents/iamRoleTrustPolicy.json');
const stackTemplate = require(__dirname + '/../Storage/AWS_Assets/Policy_Documents/amazon-stack-template-eks-vpc-real.json');

/*
 * To communicate with AWS, user must have the aws-iam-authenticator installed
 * These functions check if authenticator is already installed in user's bin folder
 * If not, the authenticator will be installed, and the path will be defined in the user's
 * .bash_profile file, which is where AWS specifies it should be
 */
const installAndConfigureAWS_IAM_Authenticator = async () => {
  try {
    const iamAuthenticatorExists = fs.existsSync(`${process.env.HOME}/bin/aws-iam-authenticator`);
    if (!iamAuthenticatorExists) {
      installIAMAuthenticator();
      enableIAMAuthenticator();
      // copyIAMAuthenticatorToBinFolder();
    }
    await setPATHAndAppendToBashProfile();
  } catch (err) {
    throw err;
  }
};

/*
 * Sets the enviroment variables AWS_STORAGE, APPLICATION_PATH, and KUBECTL_STORAGE for
 * developement. Will also make the necessary directories if they do not already exist
*/
const setEnvVarsAndMkDirsInDev = () => {
  process.env.AWS_STORAGE = `${process.env.APPLICATION_PATH}/Storage/AWS_Assets/`;
  process.env.KUBECTL_STORAGE = `${process.env.APPLICATION_PATH}/Storage/KUBECTL_Assets/`;
  mkdirp.sync(`${process.env.AWS_STORAGE}AWS_Private/`);
  mkdirp.sync(process.env.KUBECTL_STORAGE);
};

// Same as above, but for the production environment. Added caveat of setting APPLICATION_PATH
const setEnvVarsAndMkDirsInProd = () => {
  process.env.APPLICATION_PATH = `${process.env.HOME}/Library/Application\ Support/kre8`;
  process.env.AWS_STORAGE = `${process.env.APPLICATION_PATH}/Storage/AWS_Assets/`;
  process.env.KUBECTL_STORAGE = `${process.env.APPLICATION_PATH}/Storage/KUBECTL_Assets/`;
  process.env.PATH = `${process.env.PATH}:usr/local/bin:${process.env.HOME}/bin`;
  mkdirp.sync(`${process.env.AWS_STORAGE}/AWS_Private`);
  mkdirp.sync(`${process.env.AWS_STORAGE}/Policy_Documents`);
  mkdirp.sync(process.env.KUBECTL_STORAGE);
};

/**
 * Check the credentials file to determine if user needs to configure the application
 * If the awsCredentials file exists and the STATUS property is set to configured
 * then this will return true, otherwise will return false
*/
const returnKubectlAndCredentialsStatus = async () => {
  try {
    const kubectlStatus = await testKubectlStatus();
    const awsCredentialFileExists = fs.existsSync(
      `${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`,
    );

    logWithLabel('kubectlStatus', kubectlStatus);
    logWithLabel('awsCredentialFileExists', awsCredentialFileExists);

    if ((kubectlStatus === true) && awsCredentialFileExists) {
      const readAWSCredentialsFile = await fsp.readFile(
        `${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`,
        'utf-8',
      );

      const parsedCredentialsFile = JSON.parse(readAWSCredentialsFile);

      logWithLabel('this is the parsed obj', parsedCredentialsFile);
      logWithLabel('parsedCredentialsFileState', parsedCredentialsFile.STATUS);

      if (parsedCredentialsFile.STATUS === awsProps.AWS_CREDENTIALS_STATUS_CONFIGURED) {
        return true;
      }
    }

    return false;
  } catch (err) {
    logLabeledError('returnKubectlAndCredentialsStatus', err);
    return false;
  }
};

/**
 * Check if awsCredentials.json file exits, meaning user has configured KRE8 application
 * previously. If not, create the file, adding user input, and setting environment variables for
 * AWS credentials and region.
*/
const configureAWSCredentials = async (data) => {
  try {
    if (fs.existsSync(`${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`)) {
      const awsCredentialsFile = await fsp.readFile(
        `${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`,
        'utf-8',
      );
      const parsedCredentialsFile = JSON.parse(awsCredentialsFile);
      logWithLabel('Parsed obj in credentialFile in configureAWSCredentials', parsedCredentialsFile);

      parsedCredentialsFile.AWS_ACCESS_KEY_ID = data.awsAccessKeyId;
      parsedCredentialsFile.AWS_SECRET_ACCESS_KEY = data.awsSecretAccessKey;
      parsedCredentialsFile.REGION = data.awsRegion;

      process.env.AWS_ACCESS_KEY_ID = data.awsAccessKeyId;
      process.env.AWS_SECRET_ACCESS_KEY = data.awsSecretAccessKey;
      process.env.REGION = data.awsRegion;

      // TODO (braden): for debugging, let's try to remove convienently
      console.log(
        'environment variables: ',
        process.env.AWS_ACCESS_KEY_ID,
        process.env.AWS_SECRET_ACCESS_KEY,
      );

      const stringifiedCredentialFile = JSON.stringify(parsedCredentialsFile, null, 2);
      await fsp.writeFile(
        `${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`,
        stringifiedCredentialFile,
      );
    } else {
      process.env.AWS_ACCESS_KEY_ID = data.awsAccessKeyId;
      process.env.AWS_SECRET_ACCESS_KEY = data.awsSecretAccessKey;
      process.env.REGION = data.awsRegion;

      // TODO (braden): for debugging, let's try to remove convienently
      console.log(
        'environment variables: ',
        process.env.AWS_ACCESS_KEY_ID,
        process.env.AWS_SECRET_ACCESS_KEY,
      );

      const dataForCredentialsFile = {
        AWS_ACCESS_KEY_ID: data.awsAccessKeyId,
        AWS_SECRET_ACCESS_KEY: data.awsSecretAccessKey,
        REGION: data.awsRegion,
      };

      const stringifiedCredentialFile = JSON.stringify(dataForCredentialsFile, null, 2);
      await fsp.writeFile(
        `${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`,
        stringifiedCredentialFile,
      );
    }
  } catch (err) {
    logLabeledError('configureAWSCredentials', err);
    throw err;
  }
};

/** --------- CREATE AWS IAM ROLE + ATTACH POLICY DOCS ---------------
 * Check if the user has already created an IAM role by this name. If not, send IAM data to
 * AWS via the iamParams object to create an IAM Role, and save the data to the file.
 * After role is created, send Cluster + Service Policies to AWS to grant IAM Role
 * permission to operate cluster
 */
const createIAMRole = async (iamRoleName) => {
  try {
    logStep('awsEventCallbacks.createIAMRole');

    const isIAMRoleNameInMasterFile = await checkAWSMasterFile(
      awsProps.IAM_ROLE_NAME,
      iamRoleName,
    );
    logWithLabel('isIAMRoleNameInMasterFile: ', isIAMRoleNameInMasterFile);

    if (!isIAMRoleNameInMasterFile) {
      const iamParams = createIAMRoleParam(iamRoleName, iamRolePolicyDocument);
      const iamRoleDataReturnedFromAWS = await iam.createRole(iamParams).promise();

      // TODO: handle error info from AWS
      if (iamRoleDataReturnedFromAWS.Role.CreateDate) {
        logWithLabel('Data that comes back from AWS after creating a role', iamRoleDataReturnedFromAWS);
        const iamRoleData = {
          createDate: iamRoleDataReturnedFromAWS.Role.CreateDate,
          iamRoleName: iamRoleDataReturnedFromAWS.Role.RoleName,
          iamRoleArn: iamRoleDataReturnedFromAWS.Role.Arn,
        };
        await appendAWSMasterFile(iamRoleData);

        const clusterPolicyParam = { RoleName: iamRoleName, PolicyArn: awsProps.CLUSTER_POLICY_ARN };
        const servicePolicyParam = { RoleName: iamRoleName, PolicyArn: awsProps.SERVICE_POLICY_ARN };
        await Promise.all([
          iam.attachRolePolicy(clusterPolicyParam).promise(),
          iam.attachRolePolicy(servicePolicyParam).promise(),
        ]);
        return `AWS IAM Role ${iamRoleName} created with the Role ARN ${iamRoleData.iamRoleArn}.`;
      }
      logLabeledError('creating IAM role: ', iamRoleDataReturnedFromAWS);
      throw new Error(iamRoleDataReturnedFromAWS);
    } else {
      console.log('AWS IAM Role already exists.');
      return `AWS IAM Role with the name ${iamRoleName} already exists.
      Continuing with the creation process, and attaching elements to ${iamRoleName} IAM Role.`;
    }
  } catch (err) {
    logLabeledError('awsEventCallbacks.createIAMROle:', err);
    throw err;
  }
};

/**
 * createVPCSTACK() - If a VPC stack doesn't exist, according to the masterfile, then this
 * function will go through the process of creating one on AWS and writing the neccessary
 * information to the master file
 */
const createVPCStack = async (stackName) => {
  try {
    logStep('awsEventCallbacks.createVPCStack');

    const isVPCStackInMasterFile = await checkAWSMasterFile(
      awsProps.VPC_STACK_NAME,
      stackName,
    );
    logWithLabel('isVPCStackInMasterFile', isVPCStackInMasterFile);

    let parsedStackData;

    if (!isVPCStackInMasterFile) {
      const vpcStackParam = await createVPCStackParam(stackName, stackTemplate);

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
          logError(err);
          throw err;
        }
      };

      // check with AWS to see if the stack has been created, if so, move on.
      // If not, keep checking until complete. Estimated to take 1 - 1.5 mins.
      while (stackStatus === 'CREATE_IN_PROGRESS') {
        logWithLabel('stackStatus in while loop', stackStatus);
        // wait 30 seconds before rerunning function
        // eslint-disable-next-line no-await-in-loop
        await timeout(1000 * 30);
        getStackData();
      }

      if (stackStatus === 'CREATE_COMPLETE') {
        const stackDataForMasterFile = {
          stackName: parsedStackData[0].StackName,
          vpcId: parsedStackData[0].Outputs[1].OutputValue,
          subnetIdsString: parsedStackData[0].Outputs[2].OutputValue,
          securityGroupIds: parsedStackData[0].Outputs[0].OutputValue,
        };
        stackDataForMasterFile.subnetIdsArray = stackDataForMasterFile.subnetIdsString.split(',');

        await appendAWSMasterFile(stackDataForMasterFile);
      } else {
        console.error(`Error in creating stack. Stack Status = ${stackStatus}`);
        throw new Error(`Stack Status: ${stackStatus}`);
      }
      return `AWS Stack ${stackName} created.`;
    }
    // If VPC stack does exist in the master file
    console.log('Stack already exists');

    return `AWS Stack with the name ${stackName} already exists.
    Continuing with the creation process, and attaching elements to ${stackName} stack.`;
  } catch (err) {
    logLabeledError('awsEventCallbacks.createTechStack', err);
    throw err;
  }
};

/**
 * createCluster will check to see if cluster information already exists according to the
 * master file and will proceed to make one on AWS if not.
 */
const createCluster = async (clusterName) => {
  try {
    let parsedClusterData;
    logStep('awsEventCallbacks.createCluster');
    logWithLabel('ClusterCreating: ', clusterName);

    // Check if cluster has been created
    const isClusterInMasterFile = await checkAWSMasterFile(
      awsProps.CLUSTER_NAME,
      clusterName,
    );

    logWithLabel('isClusterInMasterFile', isClusterInMasterFile);

    if (!isClusterInMasterFile) {
      const awsMasterFileData = fs.readFileSync(
        `${process.env.AWS_STORAGE}AWS_Private/${process.env.CLUSTER_NAME}_MASTER_FILE.json`,
        'utf-8',
      );

      const parsedAWSMasterFileData = JSON.parse(awsMasterFileData);
      const { iamRoleArn, subnetIdsArray, securityGroupIds } = parsedAWSMasterFileData;

      const clusterParam = createClusterParam(
        clusterName,
        subnetIdsArray,
        securityGroupIds,
        iamRoleArn,
      );

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
          logWithLabel('status in getClusterData', clusterCreationStatus);
        } catch (err) {
          logLabeledError('getClusterData function from within awsEventCallbacks.createCluster:', err);
          throw err;
        }
      };

      console.log('6 min blocking timeout starting');
      // Timeout execution thread for 6 minutes to give AWS time to create cluster
      await timeout(1000 * 60 * 6);
      // Ask Amazon for cluster data
      getClusterData();

      while (clusterCreationStatus === 'CREATING') {
        // Timeout execution thread for 30 seconds before resending request to AWS for cluster data
        await timeout(1000 * 30);
        getClusterData();
      }

      // Once Cluster is created:
      if (clusterCreationStatus === 'ACTIVE') {
        logWithLabel('parsedClusterData', parsedClusterData);

        // Append relavant cluster data to AWS_MASTER_DATA file
        const clusterDataforMasterFile = {
          clusterName: parsedClusterData.cluster.name,
          clusterArn: parsedClusterData.cluster.arn,
          serverEndPoint: parsedClusterData.cluster.endpoint,
          certificateAuthorityData: parsedClusterData.cluster.certificateAuthority.data,
        };
        await appendAWSMasterFile(clusterDataforMasterFile);

        console.log('Cluster created');
        return `AWS Cluster ${clusterName} created.`;
      }
      logLabeledError('Cluster Status', clusterCreationStatus);
      throw new Error(`Cluster Status: ${clusterCreationStatus}`);
    } else {
      console.log('Cluster already exists');
      return `AWS Cluster with the name ${clusterName} already exists.
      Continuing with the creation process, and attaching elements to ${clusterName} cluster.`;
    }
  } catch (err) {
    logLabeledError('awsEventCallbacks.createCluster: ', err);
    throw err;
  }
};

module.exports = {
  installAndConfigureAWS_IAM_Authenticator,
  setEnvVarsAndMkDirsInDev,
  setEnvVarsAndMkDirsInProd,
  returnKubectlAndCredentialsStatus,
  configureAWSCredentials,
  createIAMRole,
  createVPCStack,
  createCluster,
};
