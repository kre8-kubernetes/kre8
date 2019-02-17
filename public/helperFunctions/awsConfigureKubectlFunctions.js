const awsHelperFunctions = require(__dirname + '/awsHelperFunctions'); 
const awsParameters = require(__dirname + '/awsParameters');

const EKS = require('aws-sdk/clients/eks');
const IAM = require('aws-sdk/clients/iam');
const CloudFormation = require('aws-sdk/clients/cloudformation');

const fs = require('fs');
const { spawn } = require('child_process');
const fsp = require('fs').promises;

//** --------- IMPORT DOCUMENTS ---------------- 
const stackTemplateForWorkerNode = require(__dirname + '/sdkAssets/samples/amazon-eks-worker-node-stack-template.json');


//**.ENV Variables */
const REGION = process.env.REGION;

//** --------- INITIALIZE IMPORTS --------- 
const iam = new IAM()
const eks = new EKS({ region: REGION});
const cloudformation = new CloudFormation({ region: REGION});

const kubectlConfigFunctions = {};

//**--------- GENERATE AND SAVE CONFIG FILE ON USER COMPUTER ------------- **//

kubectlConfigFunctions.createConfigFile = (clusterName) => {

  //Access data from cluster data file, saved as cluster name, in Assets and save in variables to pass to the AWSConfigFileData object*/

  const clusterDataFileContents = fs.readFileSync(__dirname + `/sdkAssets/private/${clusterName}.js`, 'utf-8');
  
  //Gather required data from Cluster File
  const parsedclusterDataFileContents = JSON.parse(clusterDataFileContents);
  const serverEndpoint = parsedclusterDataFileContents.cluster.endpoint;
  const clusterArn = parsedclusterDataFileContents.cluster.arn;
  const certificateAuthorityData = parsedclusterDataFileContents.cluster.certificateAuthority.data;

  const AWSClusterConfigFileData = awsParameters.createConfigParam(clusterName, serverEndpoint, certificateAuthorityData, clusterArn);
  
  //Format data from the AWSClusterConfigFileData object into YAML to save in user's filesystem 
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

//**--------- CONFIGURE KUBECTL WITH CONFIG FILE -------------------------- **//
kubectlConfigFunctions.configureKubectl = async (clusterName) => {

  try {

  //Insert filepath to Kube Config file into bash_profile, so kubectl knows where to look for cluster configuration information
  const textToInsertIntoBashProfile = `\nexport KUBECONFIG=$KUBECONFIG:~/.kube/${clusterName}`;
  console.log(textToInsert);

  const appendBashProfileFile = await fsp.appendFile(process.env['HOME'] + '/.bash_profile', textToInsertIntoBashProfile);
    
    
  //Reset bash_profile file
  //TODO do we need to reset this or not?
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

//** --------- CREATE / SELECT A SECOND AWS TECH STACK FOR WORKER NODE -------- **//

kubectlConfigFunctions.createStackForWorkerNode = async (stackName, clusterName) => {


  //** Stringify the saved stackTemplate document, imported at top of file to insert into stackParams object
  const stackTemplateStringified = JSON.stringify(stackTemplateForWorkerNode);

  // TODO: Verify that we do not want to collect the the commented out optional inputs in the iamParams object

  //**Collect the form data, input by the user when creating a Stack, and insert into the stackParams object
  const stackParams = {


    StackName: stackName,
    Capabilities: [
      "CAPABILITY_IAM"
    ],
    DisableRollback: false,
    EnableTerminationProtection: false,
    Parameters: [
      //TODO: universalize name 
      { "ParameterKey": "ClusterName", "ParameterValue": "carolyn-adrian-killer-cluster" },
      { "ParameterKey": "ClusterControlPlaneSecurityGroup", "ParameterValue": "sg-0c09b77bd2cdec0d7" },
      { "ParameterKey": "NodeGroupName", "ParameterValue": "worker-node"
      },
      { "ParameterKey": "NodeAutoScalingGroupMinSize", "ParameterValue": "1" },
      { "ParameterKey": "NodeAutoScalingGroupDesiredCapacity", "ParameterValue": "3"
      },
      {
        "ParameterKey": "NodeAutoScalingGroupMaxSize",
        "ParameterValue": "4"
      },
      {
        "ParameterKey": "NodeInstanceType",
        "ParameterValue": "t3.nano"
      },
      {
        "ParameterKey": "NodeImageId",
        "ParameterValue": "ami-081099ec932b99961"
      },
      {
        "ParameterKey": "KeyName",
        "ParameterValue": "CarolynClusterKey"
      },
      {
        "ParameterKey": "VpcId",
        "ParameterValue": "vpc-0815099f512fd6a3f"
      },
      {
        "ParameterKey": "Subnets",
        "ParameterValue": SUBNETIDS
      }
    ],
    TemplateBody: stackTemplateStringified,
  };

  console.log("stackParams: ", stackParams);

  //**Send Stack data to AWS via the stackParams object to create a stack on AWS

  cloudformation.createStack(stackParams, function(err, data) {
    if (err) console.log(err, err.stack); 
    else {
      console.log(data);
      next(); 
    }
        
  });
}

