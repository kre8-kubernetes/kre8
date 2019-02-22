const awsHelperFunctions = require(__dirname + '/awsHelperFunctions'); 
const awsParameters = require(__dirname + '/awsParameters');

const EKS = require('aws-sdk/clients/eks');
const IAM = require('aws-sdk/clients/iam');
const CloudFormation = require('aws-sdk/clients/cloudformation');
const EC2 = require('aws-sdk/clients/ec2')

const path = require('path');
const fs = require('fs');
const { spawn, spawnSync } = require('child_process');
const fsp = require('fs').promises;

const YAML = require('yamljs');

//** --------- IMPORT DOCUMENTS ---------------- 
const stackTemplateForWorkerNode = require(__dirname + '/../sdkAssets/samples/amazon-eks-worker-node-stack-template.json');


//**.ENV Variables */
const REGION = process.env.REGION;

//** --------- INITIALIZE IMPORTS --------- 
const iam = new IAM()
const eks = new EKS({ region: REGION });
const cloudformation = new CloudFormation({ region: REGION });
const ec2 = new EC2({ region: REGION })

const kubectlConfigFunctions = {};

//**--------- GENERATE AND SAVE CONFIG FILE ON USER COMPUTER ------------- **//

kubectlConfigFunctions.createConfigFile = (clusterName) => {

  console.log("creating config file");

  //Access data from cluster data file
  const awsMasterFileData = fs.readFileSync(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`, 'utf-8');
  
  //Gather required data 
  const parsedAWSMasterFileData = JSON.parse(awsMasterFileData);
  const serverEndpoint = parsedAWSMasterFileData.serverEndPoint;
  const clusterArn = parsedAWSMasterFileData.clusterArn;
  const certificateAuthorityData = parsedAWSMasterFileData.certificateAuthorityData;

  //Generate parameter with gathered data
  const AWSClusterConfigFileData = awsParameters.createConfigParam(clusterName, serverEndpoint, certificateAuthorityData, clusterArn);
  
  //Format data from the AWSClusterConfigFileData object into YAML to save in user's filesystem 
  let stringifiedAWSClusterConfigFile = JSON.stringify(AWSClusterConfigFileData);
  let parsedAWSClusterConfigFile = JSON.parse(stringifiedAWSClusterConfigFile);
  let yamledAWSClusterConfigFile = YAML.stringify(parsedAWSClusterConfigFile, 6);
  let regexCharToRemove = /(['])+/g;
  let yamledAWSClusterConfigFileWithoutRegex = yamledAWSClusterConfigFile.replace(regexCharToRemove, "");

  //Check if user has a .kube folder in root directory, if not, make one
  const folderName = ".kube";
  awsHelperFunctions.checkFileSystemForDirectoryAndMkDir(folderName);

  //Save file in users .kube directory
  fs.writeFileSync(`/Users/carolynharrold/${folderName}/config-${clusterName}`, yamledAWSClusterConfigFileWithoutRegex);

  //write to Masterfile that Config file was created

  const dataForAWSMasterDataFile = { ConfigFileStatus: "Created" };
  awsHelperFunctions.appendAWSMasterFile(dataForAWSMasterDataFile);
  console.log("added Config File Status to Masterfile");
};

//**--------- CONFIGURE KUBECTL WITH CONFIG FILE -------------------------- **//
kubectlConfigFunctions.configureKubectl = async (clusterName) => {

  console.log("CONFIGURE KUBECTL WITH CONFIG FILE");

  try {

  if (process.env['KUBECONFIG'] !== undefined) { 
    if (process.env['KUBECONFIG'].slice(1) !== process.env['HOME'] + `/.kube/config-${clusterName}`) {

      //read the bash profile
      //stringify the contents
      //check if teh file contains "KUBECONFIG"
      //if not, proceed
      //if so:
        //



      console.log("kubeconfig exists, but not the same");
      process.env['KUBECONFIG'] = process.env['HOME'] + `/.kube/config-${clusterName}`;
      let textToAppendToBashProfile = `\nexport KUBECONFIG=$KUBECONFIG:~/.kube/config-${clusterName}`;
      let appendBashProfileFile = await fsp.appendFile(process.env['HOME'] + '/.bash_profile', textToAppendToBashProfile);

    } else {
      console.log("kubeconfig exists and is the same");
    }
  } else {
    console.log("if kubeconfig doesn't exist");

    process.env['KUBECONFIG'] = process.env['HOME'] + `/.kube/config-${clusterName}`;

    let textToAppendToBashProfile = `\nexport KUBECONFIG=$KUBECONFIG:~/.kube/config-${clusterName}`;

    let appendBashProfileFile = await fsp.appendFile(process.env['HOME'] + '/.bash_profile', textToAppendToBashProfile);
  }

  const child = spawnSync('kubectl', ['get', 'svc']);
  console.log("child: ", child);

  const stdout = child.stdout.toString();
  console.log('stdout: ', stdout)

  const stderr = child.stderr.toString();
  console.log('stderr', stderr);

  const read = fs.readFileSync(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`, 'utf-8');

  console.log('read inside kubectl ', read);

  const dataForAWSMasterDataFile = { KubectlConfigStatus: "Configured" };
  // const stringifiedDataForAWSMasterDataFile = JSON.stringify(dataForAWSMasterDataFile);
  await awsHelperFunctions.appendAWSMasterFile(dataForAWSMasterDataFile);


  console.log("added KubectlConfigStatus to Masterfile");

  } catch (err) {
    console.log(err);
  }
}

//** --------- CREATE A SECOND AWS TECH STACK FOR WORKER NODE -------- **//

kubectlConfigFunctions.createStackForWorkerNode = async (workerNodeStackName, clusterName, subnetIdsString, vpcId, securityGroupIds) => {

  try {

    console.log("Creating Worker Node Stack");

    const awsKeyValuePairKey = "KeyName";
    const awsKeyValuePairValue = `${workerNodeStackName}Key`;

    const keyValueParam = { [awsKeyValuePairKey]: awsKeyValuePairValue };
    console.log("keyValueParam: ", keyValueParam);
    
    const isKeyValuePairInMasterFile = await awsHelperFunctions.checkAWSMasterFile(awsKeyValuePairKey, awsKeyValuePairValue);

    console.log("isKeyValuePairInMasterFile: ", isKeyValuePairInMasterFile);

    if (!isKeyValuePairInMasterFile) {
      const keyPair = await ec2.createKeyPair(keyValueParam).promise();
      await awsHelperFunctions.appendAWSMasterFile(keyValueParam);
    } else {
      console.log("aws key value pair already set");
    }

    const stackTemplateforWorkerNodeStringified = JSON.stringify(stackTemplateForWorkerNode);

    const techStackParam = awsParameters.createWorkerNodeStackParam(workerNodeStackName, stackTemplateforWorkerNodeStringified);

    //Send tech stack data to AWS to create stack 
    const stack = await cloudformation.createStack(techStackParam).promise();

    const getStackDataParam = { StackName: workerNodeStackName };

    let stringifiedStackData;
    let parsedStackData;
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
      const createStackFile = await fsp.writeFile(__dirname + `/../sdkAssets/private/STACK_${workerNodeStackName}.json`, stringifiedStackData);

      //TODO double check that data is the same, and remove unneccessary
      const stackDataForMasterFile = {
        workerNodeStackName: parsedStackData[0].StackName,
        workerNodeStackId: parsedStackData[0].StackId,
      }  

      console.log("stackDataForMasterFile: ", stackDataForMasterFile)
      await awsHelperFunctions.appendAWSMasterFile(stackDataForMasterFile);

    } else {
      //TODo fix this error handling
      console.log(`Error in creating stack. Stack Status = ${stackStatus}`)
    }

  } catch (err) {
    console.log(err);
  }

  //TODO Decide what to return to user
  return "Success";
}


//** --------- INPUT NODE INSTANCE ROLE INTO THE was-auth-cm.yaml AND APPLY -- **//

kubectlConfigFunctions.inputNodeInstance = async (workerNodeStackName, clusterName) => {

  console.log("Inside kubectlConfigFunctions.inputNodeInstance: ", workerNodeStackName);

  try {

    //TODO read new worker stack file to get new roleArn
    //TODO should this be awaited?

    // const workerNodeTechStackFile = await fs.readFileSync(__dirname + `/../sdkAssets/private/STACK_${workerNodeStackName}.json`, 'utf-8');

    const awsMasterFileData = fs.readFileSync(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`, 'utf-8');
  
    //Gather required data 
    const parsedAWSMasterFileData = JSON.parse(awsMasterFileData);
    const workerNodeStackId = parsedAWSMasterFileData.workerNodeStackId;
    
    //Generate paramater
    const paramToFile = awsParameters.createInputNodeInstance(workerNodeStackId);
    const paramToFileStringified = JSON.stringify(paramToFile);

    //Pass param to create aws-auth file
    const authFileCreate = await fsp.writeFile(__dirname + `/../sdkAssets/private/AUTH_FILE_${workerNodeStackName}.json`, paramToFileStringified);

    const filePathToAuthFile = path.join(__dirname, `../sdkAssets/private/AUTH_FILE_${workerNodeStackName}.json`);

    console.log("filepath: ", filePathToAuthFile);
    
    //Command Kubectl to configure by applying the Auth File
    const child = spawnSync('kubectl', ['apply', '-f', filePathToAuthFile]);

    const stdout = child.stdout.toString();
    console.log('stdout:', stdout);

    const stderr = child.stderr.toString();
    console.log('stdout:', stderr);

    //TODO

    const dataToAddToAWSMaster = {"nodeInstance": "created" }
    await awsHelperFunctions.appendAWSMasterFile(dataToAddToAWSMaster);

  
  } catch (err) {
    console.log(err);
  }

  console.log("Kubectl configured");
}

module.exports = kubectlConfigFunctions;


