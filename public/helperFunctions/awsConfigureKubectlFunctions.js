const awsHelperFunctions = require(__dirname + '/awsHelperFunctions'); 
const awsParameters = require(__dirname + '/awsParameters');

const EKS = require('aws-sdk/clients/eks');
const IAM = require('aws-sdk/clients/iam');
const CloudFormation = require('aws-sdk/clients/cloudformation');

const fs = require('fs');
const { spawn } = require('child_process');
const fsp = require('fs').promises;

//** --------- IMPORT DOCUMENTS ---------------- 
const stackTemplateForWorkerNode = require(__dirname + '/../sdkAssets/samples/amazon-eks-worker-node-stack-template.json');


//**.ENV Variables */
const REGION = process.env.REGION;

//** --------- INITIALIZE IMPORTS --------- 
const iam = new IAM()
const eks = new EKS({ region: REGION});
const cloudformation = new CloudFormation({ region: REGION});

const kubectlConfigFunctions = {};

//**--------- GENERATE AND SAVE CONFIG FILE ON USER COMPUTER ------------- **//

kubectlConfigFunctions.createConfigFile = (clusterName) => {

  //Access data from cluster data file
  const clusterDataFileContents = fs.readFileSync(__dirname + `/sdkAssets/private/${clusterName}.json`, 'utf-8');
  
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

  //Check if user has a .kube file in root directory, if not, make one
  awsHelperFunctions.checkFileSystemForDirectoryAndMkDir(kube);

  //Save file in users .kube directory
  fs.writeFileSync(`/Users/carolynharrold/.kube/config-{clusterName}`, yamledAWSClusterConfigFileWithoutRegex);
};

//**--------- CONFIGURE KUBECTL WITH CONFIG FILE -------------------------- **//
kubectlConfigFunctions.configureKubectl = async (clusterName) => {

  try {
  //Insert filepath to Kube Config file into bash_profile, so kubectl knows where to look for cluster config info
  const textToInsertIntoBashProfile = `\nexport KUBECONFIG=$KUBECONFIG:~/.kube/config-${clusterName}`;

  console.log("textToInsertIntoBashProfile: ", textToInsertIntoBashProfile);

  const appendBashProfileFile = await fsp.appendFile(process.env['HOME'] + '/.bash_profile', textToInsertIntoBashProfile);
    
  
  //TODO might need to reset bash profile
  // const resetBashProfile = spawnSync('source', [process.env['HOME'] + '/.bash_profile']);
    
  //Test functionality — kubectl get svc */
  const child = spawn('kubectl', ['get svc']);
    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    })
    child.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    })
    child.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });

  } catch (err) {
    console.log(err);
  }

}

//** --------- CREATE A SECOND AWS TECH STACK FOR WORKER NODE -------- **//

kubectlConfigFunctions.createStackForWorkerNode = async (clusterName, subnetIds) => {



  const workerNodeStackName = `${clusterName}WorkerNodeStack`;
  const stackTemplateStringified = JSON.stringify(stackTemplateForWorkerNode);

  const techStackParam = awsParameters.createWorkerNodeStackParam(workerNodeStackName, clusterName, subnetIds, stackTemplateStringified); 

  try {

    //Create a tech stack for worker node on AWS and save results to file in Assets Folder
    const techStackCreated = await awsHelperFunctions.createTechStack(stackName, techStackParam); 
    } catch (err) {
      console.log(err);
    }
  
}


//** --------- INPUT NODE INSTANCE ROLE INTO THE was-auth-cm.yaml AND APPLY -- **//

kubectlConfigFunctions.inputNodeInstance = async (stackName) => {

  try {

  //TODO read new worker stack file to get new roleArn
  const workerNodeTechStackFile = await fs.readFileSync(__dirname + `/../sdkAssets/private/STACK_${stackName}.json`, 'utf-8');

  
  //Gather required data from workerNodeTechStackFile
  const parsedWorkerNodeTechStackFile = JSON.parse(workerNodeTechStackFile);
  const workerNodeTechStackRoleArn = parsedWorkerNodeTechStackFile.Stacks.StackId;

  console.log("workerNodeTechStackRoleArn: ", workerNodeTechStackRoleArn);
  
  //Generate paramater
  const paramToFile = awsParameters.createInputNodeInstance(workerNodeTechStackRoleArn);

  const paramToFileStringified = JSON.stringify(paramToFile);

  //Pass param to create aws-auth file
  const authFileCreate = await fsp.writeFile(__dirname + `/sdkAssets/private/AUTH_FILE_${stackName}.json`, paramToFileStringified);


  // const authFileCreated = await fs.readFileSync(__dirname + `/sdkAssets/private/AUTH_FILE_${stackName}.json`, 'utf-8');

  // const authFileParsed = JSON.parse(authFileCreated);


  // console.log("authFileParsed: ", authFileParsed);

  const filePathToAuthFile = __dirname + `/sdkAssets/private/AUTH_FILE_${stackName}.json`;
  
  //Command Kubectl to configure by applying the Auth File
  const child = spawn('kubectl', ['apply', '-f', filePathToAuthFile]);
    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      
    })
    child.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    })
    child.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      next();
    });
  
  } catch (err) {
    console.log(err);
  }

  console.log("Kubectl configured");
}


