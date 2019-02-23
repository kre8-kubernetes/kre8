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
const iam = new IAM();
const eks = new EKS({ region: REGION});
const cloudformation = new CloudFormation({ region: REGION });

const awsEventCallbacks = {};

//** --------- CREATE AWS IAM ROLE + ATTACH POLICY DOCS --------------- **//
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
      console.log("AWS ROLE DATA: ", role);

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
      fsp.writeFile(__dirname + `/../sdkAssets/private/IAM_ROLE_${iamRoleName}.json`, stringifiedIamRoleDataFromForm);

      awsMasterFile = awsHelperFunctions.appendAWSMasterFile(iamRoleDataforMasterFile);

      //Send Cluster + Service Policies to AWS to attach to created IAM Role 
      const clusterPolicyArn = 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy';
      const servicePolicyArn = 'arn:aws:iam::aws:policy/AmazonEKSServicePolicy';

      const clusterPolicyParam = { RoleName: iamRoleName, PolicyArn: clusterPolicyArn }
      const servicePolicyParam = { RoleName: iamRoleName, PolicyArn: servicePolicyArn }

      await Promise.all([iam.attachRolePolicy(clusterPolicyParam).promise(), iam.attachRolePolicy(servicePolicyParam).promise()])

    } else {
      console.log("Returned True. Text found in Master File, Role already exists");
    }
  
  } catch (err) {
    console.log(err);
  }

  return awsMasterFile;
};

//** --------- CREATE AWS TECH STACK ------------------------------------ **//
awsEventCallbacks.createTechStack = async (stackName, stackTemplateStringified) => {

  let parsedStackData;

  try {

    const key = "stackName";

    const isTechStackInMasterFile = await awsHelperFunctions.checkAWSMasterFile(key, stackName);

    console.log("isTechStackInMasterFile: ", isTechStackInMasterFile);

    if (!isTechStackInMasterFile) {

      const techStackParam = await awsParameters.createTechStackParam(stackName, stackTemplateStringified); 

      //Send tech stack data to AWS to create stack 
      const stack = await cloudformation.createStack(techStackParam).promise();

      const getStackDataParam = { StackName: stackName };

      let stringifiedStackData;
       // TODO, remove if below works: let stackStatus = "CREATE_IN_PROGRESS";
       let stackStatus = "CREATE_IN_PROGRESS";

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
      while (stackStatus === "CREATE_IN_PROGRESS") {
        console.log("stackStatus in while loop: ", stackStatus);
        // wait 30 seconds before rerunning function
        await awsHelperFunctions.timeout(1000 * 30)
        getStackData();
      }

      if (stackStatus === "CREATE_COMPLETE") {
        const createStackFile = fsp.writeFile(__dirname + `/../sdkAssets/private/STACK_${stackName}.json`, stringifiedStackData);
        
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
    console.log(err); 
  }

  //TODO Decide what to return to user
  return parsedStackData;
};

//** --------- CREATE AWS CLUSTER ------------------------------------- **//

awsEventCallbacks.createCluster = async (clusterName) => {
  
  console.log("ClusterCreating: ", clusterName);
  //TODO, do we actually need to declare all of these here
  let parsedClusterData;
  let iamRoleArn;
  let subnetIdsString;
  let subnetIdsArray;
  let securityGroupIds;
  let vpcId;

  try {

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
          console.log(err);
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

    const isConfigFileStatusInMasterFile = await awsHelperFunctions.checkAWSMasterFile("ConfigFileStatus", "Created");

    console.log("isConfigFileStatusInMasterFile: ", isConfigFileStatusInMasterFile);

    if (!isConfigFileStatusInMasterFile) {
      await kubectlConfigFunctions.createConfigFile(clusterName);
    } else {
      console.log("Config file alreade created");
    }

    const isKubectlConfigStatusInMasterFile = await awsHelperFunctions.checkAWSMasterFile("KubectlConfigStatus", "Configured");

    console.log("isKubectlConfigStatusInMasterFile: ", isKubectlConfigStatusInMasterFile);

    if (!isKubectlConfigStatusInMasterFile) {
      await kubectlConfigFunctions.configureKubectl(clusterName);
    } else {
      console.log("Kubectl already configured");
    }

    const workerNodeStackName = `${clusterName}WorkerNodeStack2`;
    console.log("CHECKING WORKER NODE STATUS")

    const isWorkerNodeInMasterFile = await awsHelperFunctions.checkAWSMasterFile("workerNodeStackName", workerNodeStackName);

    console.log("isWorkerNodeInMasterFile: ", isWorkerNodeInMasterFile);

    if (!isWorkerNodeInMasterFile) {
      console.log("CREATING WORKE NODE")

      await kubectlConfigFunctions.createStackForWorkerNode(workerNodeStackName, clusterName, subnetIdsString, vpcId, securityGroupIds);

    } else {
      console.log("Workernode stack already created")
    }

    const isNodeInstanceMasterFile = await awsHelperFunctions.checkAWSMasterFile("nodeInstance", "created");

    console.log("isNodeInstanceMasterFile: ", isNodeInstanceMasterFile);

    if (!isNodeInstanceMasterFile) {
      await kubectlConfigFunctions.inputNodeInstance(workerNodeStackName, clusterName);
    } else {
      console.log("node instance already input");
    }
  
  } catch (err) {
    console.log("err", err);
  }
  //TODO what to return to User
  return parsedClusterData;
};


module.exports = awsEventCallbacks;