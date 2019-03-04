const awsHelperFunctions = require(__dirname + '/awsHelperFunctions'); 
const awsParameters = require(__dirname + '/awsParameters');
const kubectlConfigFunctions = require(__dirname + '/kubectlConfigFunctions');

const EKS = require('aws-sdk/clients/eks');
const IAM = require('aws-sdk/clients/iam');
const CloudFormation = require('aws-sdk/clients/cloudformation');

const fs = require('fs');
const fsp = require('fs').promises;
const { spawn } = require('child_process');

//**.ENV Variables */
const REGION = process.env.REGION;

const awsProps = require(__dirname + '/../awsPropertyNames'); 

//** --------- IMPORT DOCUMENTS ---------------- 
const iamRolePolicyDocument = require(process.env['AWS_STORAGE'] + '/AWS_Assets/Policy_Documents/iamRoleTrustPolicy.json');
const stackTemplate = require(process.env['AWS_STORAGE'] + '/AWS_Assets/Policy_Documents/amazon-stack-template-eks-vpc-real.json');

//** --------- INITIALIZE IMPORTS --------- 
const iam = new IAM();
const eks = new EKS({ region: REGION});
const cloudformation = new CloudFormation({ region: REGION });

const awsEventCallbacks = {};


//** ------- EXECUTES ON EVERY OPENING OF APPLICATION -------------------------- **//
//** ------- Check credentials file to determine if user needs to configure the application **// 
awsEventCallbacks.returnCredentialsStatus = async (data) => {

  try {

    const fileExists = fs.existsSync(process.env['AWS_STORAGE'] + 'awsCredentials.json');

    let credentialStatusToReturn;

    //TODO: Rather than checking for the text below, check for : Log In Status: SUCCESSFUL

      if (fileExists) {

        const readCredentialsFile = await fsp.readFile(process.env['AWS_STORAGE'] + 'awsCredentials.json', 'utf-8');

        const parsedCredentialsFile = JSON.parse(readCredentialsFile, null, 2);
        console.log('this is the parsed obj', parsedCredentialsFile);

        if (parsedCredentialsFile.STATUS === "CONFIGURED") {
          credentialStatusToReturn = true;
        }

      } else {
        credentialStatusToReturn = false;
      }

      return credentialStatusToReturn;

    } catch (err) {
      console.log(err);
    }

}


//** --------- CONFIGURE AWS CREDENTIALS ------------------------------ **//
awsEventCallbacks.configureAWSCredentials = async (data) => {

  // Check if AWS credentials files exists
  //if (fs.existsSync(process.env['APPLICATION_PATH'] + '/sdkAssets/private/awsCredentials.json')) {

  if (fs.existsSync(process.env['AWS_STORAGE'] + '/awsCredentials.json')) {

    
    //if so, update the file to reflect user input
    const readCredentialsFile = await fsp.readFile(process.env['AWS_STORAGE'] + 'awsCredentials.json', 'utf-8');
    const parsedCredentialsFile = JSON.parse(readCredentialsFile);
    console.log('Credeintial file this is the parsed obj', parsedCredentialsFile);

    parsedCredentialsFile.AWS_ACCESS_KEY_ID = data.awsAccessKeyId;
    parsedCredentialsFile.AWS_SECRET_ACCESS_KEY = data.awsSecretAccessKey;
    parsedCredentialsFile.REGION = data.awsRegion;

    //Explicitly set the environment variables to match user input
    process.env['AWS_ACCESS_KEY_ID'] = data.awsAccessKeyId;
    process.env['AWS_SECRET_ACCESS_KEY'] = data.awsSecretAccessKey;
    process.env['REGION'] = data.awsRegion;

    console.log("environment variables: ", process.env['AWS_ACCESS_KEY_ID'], process.env['AWS_SECRET_ACCESS_KEY'],  process.env['REGION'] )

    const stringifiedCredentialFile = JSON.stringify(parsedCredentialsFile, null, 2);

    await fsp.writeFile(process.env['AWS_STORAGE'] + 'awsCredentials.json', stringifiedCredentialFile);

  } else {
    //If the file does not exist, set the environment variables and write the file
    process.env['AWS_ACCESS_KEY_ID'] = data.awsAccessKeyId;
    process.env['AWS_SECRET_ACCESS_KEY'] = data.awsSecretAccessKey;
    process.env['REGION'] = data.awsRegion;

    console.log("environment variables: ", process.env['AWS_ACCESS_KEY_ID'], process.env['AWS_SECRET_ACCESS_KEY'],  process.env['REGION'] )

    const dataForCredentialsFile = {
      AWS_ACCESS_KEY_ID: data.awsAccessKeyId,
      AWS_SECRET_ACCESS_KEY: data.awsSecretAccessKey,
      REGION: data.awsRegion
    };

    const stringifiedCredentialFile = JSON.stringify(dataForCredentialsFile, null, 2);

    await fsp.writeFile(process.env['AWS_STORAGE'] + 'awsCredentials.json', stringifiedCredentialFile);

  }
}


//** --------- UPDATE awsCredentials FILE WITH CREDENTIAL STATUS ------------------------------ **//

awsEventCallbacks.updateCredentialsFileWithCredentialStatus= async (data) => {

  try {

    const readCredentialsFile = await fsp.readFile(process.env['AWS_STORAGE'] + 'awsCredentials.json', 'utf-8');
    const parsedCredentialsFile = JSON.parse(readCredentialsFile, null, 2);
    parsedCredentialsFile.STATUS = 'CONFIGURED';
    const stringifiedCredentialFile = JSON.stringify(parsedCredentialsFile, null, 2);
    fsp.writeFile(process.env['AWS_STORAGE'] + 'awsCredentials.json', stringifiedCredentialFile);

  } catch (err) {
    console.log(err);
  }

}


//** --------- CREATE AWS IAM ROLE + ATTACH POLICY DOCS --------------- **//
/**
 * @param {Object} data
 * @param {Object} iamRolePolicyDoc this is a JSON object that has been required in main.js
 */
awsEventCallbacks.createIAMRole = async (iamRoleName, iamRolePolicyDocument) => {

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('================  awsEventCallbacks.createIAMRole ===================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    
    
    // ** -----------------------------------------

    //Check if the user has already created a role by this name
    const isIAMRoleNameInMasterFile = await awsHelperFunctions.checkAWSMasterFile(awsProps.IAM_ROLE_NAME, iamRoleName);





    console.log("isIAMRoleNameInMasterFile: ", isIAMRoleNameInMasterFile);

    //If not, send IAM data to AWS via the iamParams object to create an IAM Role, and save the data to the file.
    if (!isIAMRoleNameInMasterFile) {

      const iamParams = awsParameters.createIAMRoleParam(iamRoleName, iamRolePolicyDocument);

      const role = await iam.createRole(iamParams).promise();

      //TODO: handle error info from AWS
      if (role.Role.CreateDate) {

        console.log("Data that comes back from AWS after creating a role", role);

        const iamRoleData = {
          createDate: role.Role.CreateDate,
          iamRoleName: role.Role.RoleName,
          iamRoleArn: role.Role.Arn,
        }

        // ** -----------------------------------------

        await awsHelperFunctions.appendAWSMasterFile(iamRoleData, iamRoleName);






      //Send Cluster + Service Policies to AWS to attach to created IAM Role
        const clusterPolicyParam = { RoleName: iamRoleName, PolicyArn: awsProps.CLUSTER_POLICY_ARN };

        const servicePolicyParam = { RoleName: iamRoleName, PolicyArn: awsProps.SERVICE_POLICY_ARN };

        await Promise.all([
          iam.attachRolePolicy(clusterPolicyParam).promise(), 
          iam.attachRolePolicy(servicePolicyParam).promise()
        ])

        return iamRoleData;

      } else {
        //TODO: address this error situation
        console.log("AWS IAM Role already exists.");
        return `${iamRoleName} already exists.`;
      }

    } else {
      console.log("AWS IAM Role already exists.");
      return `${iamRoleName} already exists.`;

    }


  } catch (err) {
    console.log('Error from awsEventCallbacks.createIAMROle:', err);
  }

};


//** --------- CREATE AWS STACK ------------------------------------ **//
/**
 * @param {String} stackName
 * @param {String} stackTemplateStringified this is a JSON object that was stringified right before being passed in as an argument
 */
awsEventCallbacks.createVPCStack = async (stackName, stackTemplate, iamRoleName) => {


  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('================  awsEventCallbacks.createVPCStack =================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    const isVPCStackInMasterFile = await awsHelperFunctions.checkAWSMasterFile(awsProps.VPC_STACK_NAME, stackName);

    console.log("isVPCStackInMasterFile: ", isVPCStackInMasterFile);

    let parsedStackData;

    if (!isVPCStackInMasterFile) {

      const vpcStackParam = await awsParameters.createVPCStackParam(stackName, stackTemplate); 

      //Send tech stack data to AWS to create stack 
      await cloudformation.createStack(vpcStackParam).promise();


      let stringifiedStackData;

      let stackStatus = "CREATE_IN_PROGRESS";

      const getStackDataParam = { StackName: stackName };
      const getStackData = async () => {
        try {
          const stackData = await cloudformation.describeStacks(getStackDataParam).promise();
          stringifiedStackData = JSON.stringify(stackData.Stacks, null, 2);
          parsedStackData = JSON.parse(stringifiedStackData);
          stackStatus = parsedStackData[0].StackStatus;
        } catch (err) {
          console.log(err);
        }
      }
    
    //check with AWS to see if the stack has been created, if so, move on. If not, keep checking until complete. Estimated to take 1 - 1.5 mins.
      while (stackStatus === "CREATE_IN_PROGRESS") {
        console.log("stackStatus in while loop: ", stackStatus);
        // wait 30 seconds before rerunning function
        await awsHelperFunctions.timeout(1000 * 30)
        getStackData();
      }

      if (stackStatus === "CREATE_COMPLETE") {        
        
        const stackDataForMasterFile = {
          stackName: parsedStackData[0].StackName,
          vpcId: parsedStackData[0].Outputs[1].OutputValue,
          subnetIdsString: parsedStackData[0].Outputs[2].OutputValue,
          securityGroupIds: parsedStackData[0].Outputs[0].OutputValue
        }
        stackDataForMasterFile.subnetIdsArray = stackDataForMasterFile.subnetIdsString.split(',');

        await awsHelperFunctions.appendAWSMasterFile(stackDataForMasterFile, iamRoleName);


      } else {
        console.log(`Error in creating stack. Stack Status = ${stackStatus}`);
        return `Error in creating stack. Stack Status = ${stackStatus}`;
      }

    return parsedStackData;


    } else {
      console.log("Stack already exists");
      return 'Stack already exists';
    }

  } catch (err) {
    console.log('Error from awsEventCallbacks.createTechStack:', err); 
  }
};

//** --------- CREATE AWS CLUSTER ------------------------------------- **//

awsEventCallbacks.createCluster = async (clusterName) => {
  
  console.log("ClusterCreating: ", clusterName);
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

    console.log('The process.env:', process.env);

    // FIXME: should we move these master file property names to a constants page and require the object in?
    const key = "clusterName";
    
    //Check if cluster has been created. If not:
    const isClusterInMasterFile = await awsHelperFunctions.checkAWSMasterFile(key, clusterName);

    console.log("isClusterInMasterFile: ", isClusterInMasterFile);

    if (!isClusterInMasterFile) {

      //const awsMasterFileData = fs.readFileSync(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`, 'utf-8');

      const awsMasterFileData = fs.readFileSync(process.env['AWS_STORAGE'] + 'AWS_MASTER_DATA.json', 'utf-8');


      const parsedaAWSMasterFileData = JSON.parse(awsMasterFileData);
      iamRoleArn = parsedaAWSMasterFileData.iamRoleArn;
      subnetIdsString = parsedaAWSMasterFileData.subnetIdsString;
      subnetIdsArray = parsedaAWSMasterFileData.subnetIdsArray;
      securityGroupIds = parsedaAWSMasterFileData.securityGroupIds;
      vpcId = parsedaAWSMasterFileData.vpcId;

      const clusterParam = awsParameters.createClusterParam(clusterName, subnetIdsArray, securityGroupIds, iamRoleArn);

      //Send cluster data to AWS via clusterParmas to create a cluster 
      const cluster = await eks.createCluster(clusterParam).promise();
        
      const getClusterDataParam = { name: clusterName };

      let stringifiedClusterData;
      let clusterCreationStatus = "CREATING";

      //Request cluster data from AWS and check cluster creation status
      const getClusterData = async () => {
        try {
          const clusterData = await eks.describeCluster(getClusterDataParam).promise();
          stringifiedClusterData = JSON.stringify(clusterData, null, 2);
          parsedClusterData = JSON.parse(stringifiedClusterData);
          clusterCreationStatus = parsedClusterData.cluster.status;
          
          console.log("status in getClusterData: ", clusterCreationStatus);
        } catch (err) {
          console.log('Error from the getClusterData function from within awsEventCallbacks.createCluster:', err);
        }
      }
      
      console.log("6 min settimeout starting");
      //Timeout execution thread for 6 minutes to give AWS time to create cluster
      await awsHelperFunctions.timeout(1000 * 60 * 6);

      //Ask Amazon for cluster data
      getClusterData();

      while (clusterCreationStatus === "CREATING") {
        //Timeout execution thread for 30 seconds before resending request to AWS for cluster data
        await awsHelperFunctions.timeout(1000 * 30)
        getClusterData();
      }

      //Once Cluster is creted:
      if (clusterCreationStatus === "ACTIVE") {
      
        //Create a file holding the cluster data from AWS
        const createClusterFile = await fsp.writeFile(__dirname + `/../sdkAssets/private/CLUSTER_${clusterName}.json`, stringifiedClusterData); 
        console.log("parsedClusterData: ", parsedClusterData)

        //Append relavant cluster data to AWS_MASTER_DATA file
        clusterDataforMasterFile = {
          clusterName: parsedClusterData.cluster.name,
          clusterArn: parsedClusterData.cluster.arn,
          serverEndPoint: parsedClusterData.cluster.endpoint,
          certificateAuthorityData: parsedClusterData.cluster.certificateAuthority.data,
        }
        //TODO double check
        await awsHelperFunctions.appendAWSMasterFile(clusterDataforMasterFile, iamRoleName);
      } else {
        console.log(`Error in creating cluster. Cluster Status = ${clusterStatus}`);
      }
    } else {
      console.log("Cluster already exists");
    }
    // FIXME: write a file to hold the string of the master file property names
    const isConfigFileStatusInMasterFile = await awsHelperFunctions.checkAWSMasterFile("ConfigFileStatus", "Created");

    console.log("isConfigFileStatusInMasterFile: ", isConfigFileStatusInMasterFile);

    if (!isConfigFileStatusInMasterFile) {
      await kubectlConfigFunctions.createConfigFile(clusterName);
    } else {
      console.log("Config file alreade created");
    }

    // FIXME: write a file to hold the string of the master file property names
    const isKubectlConfigStatusInMasterFile = await awsHelperFunctions.checkAWSMasterFile("KubectlConfigStatus", "Configured");

    console.log("isKubectlConfigStatusInMasterFile: ", isKubectlConfigStatusInMasterFile);

    if (!isKubectlConfigStatusInMasterFile) {
      await kubectlConfigFunctions.configureKubectl(clusterName);
    } else {
      console.log("Kubectl already configured");
    }

    const workerNodeStackName = `${clusterName}-worker-node`;
    console.log("CHECKING WORKER NODE STATUS")

    // FIXME: write a file to hold the string of the master file property names
    const isWorkerNodeInMasterFile = await awsHelperFunctions.checkAWSMasterFile("workerNodeStackName", workerNodeStackName);

    console.log("isWorkerNodeInMasterFile: ", isWorkerNodeInMasterFile);

    if (!isWorkerNodeInMasterFile) {
      console.log("CREATING WORKER NODE")

      await kubectlConfigFunctions.createStackForWorkerNode(workerNodeStackName, clusterName, subnetIdsString, vpcId, securityGroupIds);

    } else {
      console.log("Workernode stack already created")
    }
    // FIXME: write a file to hold the string of the master file property names
    const isNodeInstanceMasterFile = await awsHelperFunctions.checkAWSMasterFile("nodeInstance", "created");

    console.log("isNodeInstanceMasterFile: ", isNodeInstanceMasterFile);

    if (!isNodeInstanceMasterFile) {
      process.env['KUBECONFIG'] = `:${process.env['HOME']}/.kube/config-${clusterName}`
      await kubectlConfigFunctions.inputNodeInstance(workerNodeStackName, clusterName);
    } else {
      console.log("node instance already input");
    }
  
  } catch (err) {
    console.log('Error from awsEventCallbacks.createCluster: ', err);
  }
  //TODO: what to return to User
  return parsedClusterData;
};


module.exports = awsEventCallbacks;