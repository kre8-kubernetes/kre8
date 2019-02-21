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
  const clusterDataFileContents = fs.readFileSync(__dirname + `/../sdkAssets/private/CLUSTER_${clusterName}.json`, 'utf-8');
  
  //Gather required data 
  const parsedClusterDataFileContents = JSON.parse(clusterDataFileContents);
  const serverEndpoint = parsedClusterDataFileContents.cluster.endpoint;
  const clusterArn = parsedClusterDataFileContents.cluster.arn;
  const certificateAuthorityData = parsedClusterDataFileContents.cluster.certificateAuthority.data;

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
};

//**--------- CONFIGURE KUBECTL WITH CONFIG FILE -------------------------- **//
kubectlConfigFunctions.configureKubectl = async (clusterName) => {

  console.log("CONFIGURE KUBECTL WITH CONFIG FILE");

  try {

  if (process.env['KUBECONFIG'] !== undefined) { 
    if (process.env['KUBECONFIG'].slice(1) !== process.env['HOME'] + `/.kube/config-${clusterName}`) {
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


  } catch (err) {
    console.log(err);
  }
}

//** --------- CREATE A SECOND AWS TECH STACK FOR WORKER NODE -------- **//

kubectlConfigFunctions.createStackForWorkerNode = async (clusterName, subnetIds, vpcId, securityGroupIds) => {
  console.log("Creating Stack");

  try {

    const workerNodeStackName = `${clusterName}WorkerNodeStack`;

    const keyPair = await ec2.createKeyPair({ KeyName: `${workerNodeStackName}Key` }).promise();

    const keyName = `${workerNodeStackName}Key`;
    const stackTemplateStringified = JSON.stringify(stackTemplateForWorkerNode);

    const techStackParam = awsParameters.createWorkerNodeStackParam(workerNodeStackName, clusterName, subnetIds, vpcId, securityGroupIds, stackTemplateStringified, keyName);

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

      awsHelperFunctions.appendAWSMasterFile(stringifiedStackData);


    } else {
      console.log(`Error in creating stack. Stack Status = ${stackStatus}`)
    }

  } catch (err) {
    console.log(err);
  }

  //TODO Decide what to return to user
  return "Success";
}


//** --------- INPUT NODE INSTANCE ROLE INTO THE was-auth-cm.yaml AND APPLY -- **//

kubectlConfigFunctions.inputNodeInstance = async (clusterName) => {

  const workerNodeStackName = `${clusterName}WorkerNodeStack`;

  console.log("Inside kubectlConfigFunctions.inputNodeInstance: ", workerNodeStackName);

  try {

    //TODO read new worker stack file to get new roleArn
    const workerNodeTechStackFile = await fs.readFileSync(__dirname + `/../sdkAssets/private/STACK_${workerNodeStackName}.json`, 'utf-8');

    
    //Gather required data from workerNodeTechStackFile
    const parsedWorkerNodeTechStackFile = JSON.parse(workerNodeTechStackFile);
    const workerNodeTechStackRoleArn = parsedWorkerNodeTechStackFile[0].StackId;
    
    //Generate paramater
    const paramToFile = awsParameters.createInputNodeInstance(workerNodeTechStackRoleArn);

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
  
  } catch (err) {
    console.log(err);
  }

  console.log("Kubectl configured");
}

module.exports = kubectlConfigFunctions;


