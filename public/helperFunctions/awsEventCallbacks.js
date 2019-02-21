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
awsEventCallbacks.createIAMRoleAndCreateFileAndAttachPolicyDocs = async (roleName, roleDescription, iamRolePolicyDoc) => {

  let awsMasterFile;

  try {

    const key = "iamRoleName";
    let awsMasterFile;

    if (!awsHelperFunctions.checkAWSMasterFile(key, roleName)) {

      const iamParams = awsParameters.createIAMRoleParam(roleName, roleDescription, iamRolePolicyDoc);

      //Send IAM data to AWS via the iamParams object to create an IAM Role*/
      const role = await iam.createRole(iamParams).promise();

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
      fsp.writeFile(__dirname + `/../sdkAssets/private/IAM_ROLE_${roleName}.json`, stringifiedIamRoleDataFromForm);

      awsMasterFile = awsHelperFunctions.appendAWSMasterFile(iamRoleDataforMasterFile);

      //TO: DELETE Create file named for MASTER FILE and save in assets folder 
      // fsp.writeFile(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`, stringifiedIamRoleDataforMasterFile);

      //Send Cluster + Service Policies to AWS to attach to created IAM Role 
      const clusterPolicyArn = 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy';
      const servicePolicyArn = 'arn:aws:iam::aws:policy/AmazonEKSServicePolicy';

      const clusterPolicyParam = { RoleName: roleName, PolicyArn: clusterPolicyArn }
      const servicePolicyParam = { RoleName: roleName, PolicyArn: servicePolicyArn }

      await Promise.all([iam.attachRolePolicy(clusterPolicyParam).promise(), iam.attachRolePolicy(servicePolicyParam).promise()])

    } else {
      console.log("Text found in Master File, Role already exists");
    }
  
  } catch (err) {
    console.log(err);
  }

  return awsMasterFile;
};

//** --------- CREATE AWS TECH STACK + SAVE RETURNED DATA IN FILE ----- **//
awsEventCallbacks.createTechStackAndSaveReturnedDataInFile = async (stackName, stackTemplateStringified) => {

  try {

    const key = "stackName";

    if (!awsHelperFunctions.checkAWSMasterFile(key, stackName)) {

      const techStackParam = await awsParameters.createTechStackParam(stackName, stackTemplateStringified); 

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

        awsHelperFunctions.appendAWSMasterFile(stackDataForMasterFile);

      } else {
        console.log(`Error in creating stack. Stack Status = ${stackStatus}`)
      }

    //TODO Read Master File, Append Master File

    //let appendMasterFile = fsp.appendFile(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`, textToAppendToBashProfile);

    } else {
      console.log("Stack already exists");
    }

  } catch (err) { 
    console.log(err); 
  }

  //TODO Decide what to return to user
  return stackName;
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

      try {
        const clusterData = await eks.describeCluster(fetchClusterDataParam).promise();
        stringifiedClusterData = JSON.stringify(clusterData, null, 2);
        parsedClusterData = JSON.parse(stringifiedClusterData);
        clusterCreationStatus = parsedClusterData.cluster.status;
        
        console.log("status in getClusterData: ", clusterCreationStatus);
      } catch (err) {
        console.log(err);
      }
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

    // const securityGroupIds = parsedClusterFileContents.cluster.resourcesVpcConfig.securityGroupIds[0];
    console.log("securityGroupIds: ", securityGroupIds)
    const vpcId = parsedClusterFileContents.cluster.resourcesVpcConfig.vpcId;
    console.log("vpcId: ", vpcId)
    
    await kubectlConfigFunctions.createConfigFile(clusterName);
    await kubectlConfigFunctions.configureKubectl(clusterName);
    await kubectlConfigFunctions.createStackForWorkerNode(clusterName, subnetIds, vpcId, securityGroupIds);

    await kubectlConfigFunctions.inputNodeInstance(clusterName);
  
  } catch (err) {
    console.log("err", err);
  }

  //TODO what to return to User
  return clusterName;
};


module.exports = awsEventCallbacks;