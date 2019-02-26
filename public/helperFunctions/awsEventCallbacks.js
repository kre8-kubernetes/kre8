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

//** --------- INITIALIZE IMPORTS --------- 
const iam = new IAM();
const eks = new EKS({ region: REGION});
const cloudformation = new CloudFormation({ region: REGION });

const awsEventCallbacks = {};


//** --------- CONFIGURE AWS CREDENTIALS ------------------------------ **//

awsEventCallbacks.configureAWSCredentials = async (data) => {

  // const stringifiedDataForAWSConfigFile = JSON.stringify(data, null, 2);
  // const awsConfigFile = await fsp.writeFile(__dirname + `/../sdkAssets/private/AWS_CONFIG_DATA.json`, stringifiedDataForAWSConfigFile);

}




//** --------- CREATE AWS IAM ROLE + ATTACH POLICY DOCS --------------- **//
/**
 * @param {String} iamRoleName
 * @param {String} iamRoleDescription
 * @param {Object} iamRolePolicyDoc this is a JSON object that has been required in main.js
 */
awsEventCallbacks.createIAMRole = async (iamRoleName, roleDescription, iamRolePolicyDoc) => {

  let awsMasterFile;

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('================  awsEventCallbacks.createIAMRole ===================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    const key = "iamRoleName";

    //test to see if the role by this name already exists. If false, do this:
    const isIAMRoleNameInMasterFile = await awsHelperFunctions.checkAWSMasterFile(key, iamRoleName);

    console.log("isIAMRoleNameInMasterFile: ", isIAMRoleNameInMasterFile);

    if (!isIAMRoleNameInMasterFile) {

      const iamParams = awsParameters.createIAMRoleParam(iamRoleName, roleDescription, iamRolePolicyDoc);

      //Send IAM data to AWS via the iamParams object to create an IAM Role*/
      const role = await iam.createRole(iamParams).promise();
      console.log("Data that comes back from AWS after creating a role", role);

      //Collect the relevant IAM data returned from AWS
      const iamRoleDataFromForm = {
        iamRoleName: role.Role.RoleName,
        roleID: role.Role.RoleId,
        iamRoleArn: role.Role.Arn,
        createDate: role.Role.CreateDate,
        path: role.Role.Path
      }

      const iamRoleDataforMasterFile = {
        createDate: role.Role.CreateDate,
        iamRoleName: role.Role.RoleName,
        iamRoleArn: role.Role.Arn,
      }

      const stringifiedIamRoleDataFromForm = JSON.stringify(iamRoleDataFromForm, null, 2);
      // const stringifiedIamRoleDataforMasterFile = JSON.stringify(iamRoleDataforMasterFile);
      
      //Create file named for IAM Role and save in assets folder 
      // FIXME: Do we need this file anymore???
      await fsp.writeFile(__dirname + `/../sdkAssets/private/IAM_ROLE_${iamRoleName}.json`, stringifiedIamRoleDataFromForm);

      awsMasterFile = awsHelperFunctions.appendAWSMasterFile(iamRoleDataforMasterFile);

      //Send Cluster + Service Policies to AWS to attach to created IAM Role
      // FIXME: Can we move these outside of the function? Possibly as a string const that we import
      const clusterPolicyArn = 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy';
      const servicePolicyArn = 'arn:aws:iam::aws:policy/AmazonEKSServicePolicy';

      const clusterPolicyParam = { RoleName: iamRoleName, PolicyArn: clusterPolicyArn }
      const servicePolicyParam = { RoleName: iamRoleName, PolicyArn: servicePolicyArn }

      await Promise.all([iam.attachRolePolicy(clusterPolicyParam).promise(), iam.attachRolePolicy(servicePolicyParam).promise()])

    } else {
      console.log("Returned True. Text found in Master File, Role already exists");
    }

  } catch (err) {
    console.log('Error from awsEventCallbacks.createIAMROle:', err);
  }

  return awsMasterFile;
};


//** --------- CREATE AWS TECH STACK ------------------------------------ **//
/**
 * @param {String} stackName
 * @param {String} stackTemplateStringified this is a JSON object that was stringified right before being passed in as an argument
 */
awsEventCallbacks.createTechStack = async (stackName, stackTemplateStringified) => {

  let parsedStackData;

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('================  awsEventCallbacks.createTechStack =================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    // FIXME: should we move these master file property names to a constants page and require the object in?
    const key = "stackName";

    const isTechStackInMasterFile = await awsHelperFunctions.checkAWSMasterFile(key, stackName);

    console.log("isTechStackInMasterFile: ", isTechStackInMasterFile);

    if (!isTechStackInMasterFile) {

      const techStackParam = await awsParameters.createTechStackParam(stackName, stackTemplateStringified); 

      //Send tech stack data to AWS to create stack 
      const stack = await cloudformation.createStack(techStackParam).promise();

      const getStackDataParam = { StackName: stackName };

      let stringifiedStackData;
      // TODO:, remove if below works: let stackStatus = "CREATE_IN_PROGRESS";
      let stackStatus = "CREATE_IN_PROGRESS";

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
        // FIXME: do we need this now that we have a master file for this data
        const createStackFile = await fsp.writeFile(__dirname + `/../sdkAssets/private/STACK_${stackName}.json`, stringifiedStackData);
        
        const stackDataForMasterFile = {
          stackName: parsedStackData[0].StackName,
          vpcId: parsedStackData[0].Outputs[1].OutputValue,
          subnetIdsString: parsedStackData[0].Outputs[2].OutputValue,
          securityGroupIds: parsedStackData[0].Outputs[0].OutputValue
        }
        stackDataForMasterFile.subnetIdsArray = stackDataForMasterFile.subnetIdsString.split(',');

        await awsHelperFunctions.appendAWSMasterFile(stackDataForMasterFile);

      } else {
        console.log(`Error in creating stack. Stack Status = ${stackStatus}`)
      }

    } else {
      console.log("Stack already exists");
    }

  } catch (err) {
    console.log('Error from awsEventCallbacks.createTechStack:', err); 
  }

  //TODO: Decide what to return to user
  return parsedStackData;
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

    // FIXME: should we move these master file property names to a constants page and require the object in?
    const key = "clusterName";
    
    //Check if cluster has been created. If not:
    const isClusterInMasterFile = await awsHelperFunctions.checkAWSMasterFile(key, clusterName);

    console.log("isClusterInMasterFile: ", isClusterInMasterFile);

    if (!isClusterInMasterFile) {

      const awsMasterFileData = fs.readFileSync(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`, 'utf-8');

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
        awsHelperFunctions.appendAWSMasterFile(clusterDataforMasterFile);
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