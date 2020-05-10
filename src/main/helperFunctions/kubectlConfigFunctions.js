const { NODE_ENV } = process.env;

// --------- NPM MODULES ----------------
const YAML = require('yamljs');

// --------- NODE APIS ----------------
const path = require('path');
const { spawnSync } = require('child_process');
const fsp = require('fs').promises;
const fs = require('fs');

// --------- AWS SDK ELEMENTS -----------
const CloudFormation = require('aws-sdk/clients/cloudformation');
const EC2 = require('aws-sdk/clients/ec2');

// --------- INSTANTIATE AWS CLASSES -----------
const ec2 = new EC2({ region: 'us-west-2' });
const cloudformation = new CloudFormation({ region: 'us-west-2' });

// --------- IMPORT MODULES -----------

const {
  logWithLabel,
  logStep,
  logError,
  logLabeledError,
} = require('../utils');

const { timeout } = require('../utils/async');

const {
  checkFileSystemForDirectoryAndMkDir,
  checkAWSMasterFile,
  appendAWSMasterFile,
} = require(__dirname + '/awsHelperFunctions');

const {
  createConfigParam,
  createWorkerNodeStackParam,
} = require(__dirname + '/awsParameters');

const awsProps = require(__dirname + '/../awsPropertyNames'); 

// --------- IMPORT DOCUMENT TEMPLATES -----
const stackTemplateForWorkerNode = require(
  path.join(__dirname, '/../Storage/AWS_Assets/Policy_Documents/amazon-eks-worker-node-stack-template.json')
);

/**
 * This function will make a .kube folder, check if there is a config file in there
 * with the matching name of our cluster and make one if not.
 * @param {String} clusterName
 * @return {String}
 */
const createConfigFile = async (clusterName) => {
  try {
    logStep('kubectlConfigFunctions.createConfigFile')
    console.log('creating config file');

    // check if .kube folder exists, and if not, make it
    checkFileSystemForDirectoryAndMkDir(awsProps.KUBE);
    // check for config file
    const configFileExists = fs.existsSync(`${process.env.HOME}/.kube/config-${clusterName}`);

    if (!configFileExists) {
      console.log('CONFIG FILE DID NOT EXIST');

      // Read Master File and grab data
      const awsMasterFileData = await fsp.readFile(
        `${process.env.AWS_STORAGE}AWS_Private/${clusterName}_MASTER_FILE.json`,
        'utf-8',
      );

      const parsedAWSMasterFileData = JSON.parse(awsMasterFileData);
      logWithLabel('parsed parsedAWSMasterFileData', `===>\n${parsedAWSMasterFileData}\n`);
      const { serverEndPoint, certificateAuthorityData } = parsedAWSMasterFileData;

      // Generate parameter with gathered data
      const AWSClusterConfigFileData = createConfigParam(
        clusterName,
        serverEndPoint,
        certificateAuthorityData,
      );

      // Format data from the AWSClusterConfigFileData object into YAML to save in user's filesystem
      const stringifiedAWSClusterConfigFile = JSON.stringify(AWSClusterConfigFileData);
      const parsedAWSClusterConfigFile = JSON.parse(stringifiedAWSClusterConfigFile);
      const yamledAWSClusterConfigFile = YAML.stringify(parsedAWSClusterConfigFile, 6);
      const regexCharToRemove = /(['])+/g;
      const yamledAWSClusterConfigFileWithoutRegex = yamledAWSClusterConfigFile.replace(regexCharToRemove, "");

      // Save file in users .kube directory
      await fsp.writeFile(
        `${process.env.HOME}/.kube/config-${clusterName}`,
        yamledAWSClusterConfigFileWithoutRegex,
      );

      return `The kubeclt config file has been created in the .kube folder 
      in the root directory. Proceeding with the process.`;
    }
    console.log('Config file already created');
    return `The kubeclt config file was already created in the .kube folder 
    in the root directory. Proceeding with the process.`;
  } catch (err) {
    logLabeledError('From checkFileSytemForDirectoryAndMkDir', err);
    throw err;
  }
};

/**
 * configureKubectl() will see if the OS's bashprofile has a KUBECONFIG
 * environment variable set. This will write a new environment variable if not or
 * will set it to the current cluster if it doesn't currently match the target cluster.
 * @param {String} clusterName
 * @return {undefined}
 */
const configureKubectl = async (clusterName) => {
  try {
    console.log('CONFIGURE KUBECTL WITH CONFIG FILE');
    logStep('kubectlConfigFunctions.configureKubectl')
    console.log('process.env.KUBECONFIG before: ', process.env.KUBECONFIG);

    process.env.KUBECONFIG = `${process.env.HOME}/.kube/config-${clusterName}`;

    logWithLabel('process.env.KUBECONFIG after', process.env.KUBECONFIG);

    let bashRead = await fsp.readFile(`${process.env.HOME}/.bash_profile`, 'utf-8');

    if (bashRead.includes('export KUBECONFIG')) {
      if (!bashRead.includes(clusterName)) {
        bashRead = bashRead.replace(
          /export KUBECONFIG\S*/g,
          `export KUBECONFIG=$HOME/.kube/config-${clusterName}`,
        );
        logWithLabel('bashRead', bashRead);

        await fsp.writeFile(`${process.env.HOME}/.bash_profile`, bashRead, 'utf-8');

        console.log('re-wrote .bash_profile to set KUBECONFIG env var to the new cluster config file');
      }
    } else {
      const textToAppendToBashProfile = `\nexport KUBECONFIG=$HOME/.kube/config-${clusterName}`;
      await fsp.appendFile(`${process.env.HOME}/.bash_profile`, textToAppendToBashProfile);
    }
  } catch (err) {
    logLabeledError('kubectlConfigFunctions.configureKubectl', err);
    throw err;
  }
};

/**
 * This will test if kubectl is configured to a running cluster. If the kubectl command
 * pipes out an error then we know it is not configured. index.js will handle the error
 * that we throw.
 * @param {String} clusterName
 * @return {undefined}
 */
const testKubectlGetSvc = () => {
  try {
    logWithLabel('this is the current KUBECONFIG at kubectl get svc time:', process.env.KUBECONFIG);
    const child = spawnSync('kubectl', ['get', 'svc'], { env: process.env });
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();

    if (!stderr) {
      logWithLabel('Kubectl has been configured. Here is the service data', stdout);
      return (`Kubectl has been configured. Here is the service data: ${stdout}`);
    }
    throw new Error(stderr);
  } catch (err) {
    logLabeledError('kubectlConfigFunctions.testKubectlGetSvc', err);
    throw err;
  }
};

/** --------- CREATE A SECOND AWS TECH STACK FOR WORKER NODE ------------
 * createStackForWorkerNode() will check if the worker node information is in the master file,
 * and proceed to create the tech stack on AWS if the revelent information isn't found.
 * @param {String} clusterName
 * @return {String}
 */
const createStackForWorkerNode = async (clusterName) => {
  try {
    logStep('kubectlConfigFunctions.createStackForWorkerNode')
    const workerNodeStackName = `${clusterName}-worker-node`;
    console.log('CHECKING WORKER NODE STATUS');

    const isWorkerNodeInMasterFile = await checkAWSMasterFile(
      awsProps.WORKER_NODE_STACK_NAME,
      workerNodeStackName,
    );
    logWithLabel('isWorkerNodeInMasterFile', isWorkerNodeInMasterFile);

    if (!isWorkerNodeInMasterFile) {
      console.log('CREATING WORKER NODE');
      const awsEC2KeyPairName = `${workerNodeStackName}-Key`;
      const awsEC2KeyPairParam = { [awsProps.EC2_KEY_PAIR]: awsEC2KeyPairName };
      console.log('awsEC2KeyPairParam: ', awsEC2KeyPairParam);
      const isKeyPairInMasterFile = await checkAWSMasterFile(awsProps.EC2_KEY_PAIR, awsEC2KeyPairName);
      console.log('isKeyPairInMasterFile: ', isKeyPairInMasterFile);

      if (!isKeyPairInMasterFile) {
        const keyPair = await ec2.createKeyPair(awsEC2KeyPairParam).promise();
        logWithLabel('Here is the newly created key pair for this cluster', keyPair);
        await appendAWSMasterFile(awsEC2KeyPairParam);
      } else {
        console.log('aws key value pair already set');
      }
      const techStackParam = createWorkerNodeStackParam(
        clusterName,
        workerNodeStackName,
        stackTemplateForWorkerNode,
      );

      // Send tech stack data to AWS to create stack
      await cloudformation.createStack(techStackParam).promise();

      const getStackDataParam = { StackName: workerNodeStackName };
      let stringifiedStackData;
      let parsedStackData;
      let stackStatus = 'CREATE_IN_PROGRESS';

      const getStackData = async () => {
        try {
          const stackData = await cloudformation.describeStacks(getStackDataParam).promise();
          stringifiedStackData = JSON.stringify(stackData.Stacks, null, 2);
          parsedStackData = JSON.parse(stringifiedStackData);
          stackStatus = parsedStackData[0].StackStatus;
        } catch (err) {
          logLabeledError('getStackData: in createStackForWorkerNode', err);
          throw err;
        }
      };
      // check with AWS to see if the stack has been created, if so, move on. If not,
      // keep checking until complete. Estimated to take 1 - 1.5 mins.
      while (stackStatus === 'CREATE_IN_PROGRESS') {
        logWithLabel('stackStatus in while loop: ', stackStatus);
        // wait 30 seconds before rerunning function
        // eslint-disable-next-line no-await-in-loop
        await timeout(1000 * 30);
        getStackData();
      }

      if (stackStatus === 'CREATE_COMPLETE') {
        const stackDataForMasterFile = {
          workerNodeStackName: parsedStackData[0].StackName,
          nodeInstanceRoleArn: parsedStackData[0].Outputs[0].OutputValue,
        };
        logWithLabel('stackDataForMasterFile: ', stackDataForMasterFile);
        await appendAWSMasterFile(stackDataForMasterFile);
      } else {
        logError(`Error in creating stack. Stack Status = ${stackStatus}`);
        throw new Error(`Error in creating stack. Stack Status = ${stackStatus}`);
      }
    }
    console.log('Workernode stack already exists');
    return `AWS Worker Node stack with the name ${clusterName}-worker-node
    already exists. Continuing with the creation process, and attaching elements
    to ${clusterName}-worker-node stack.`;
  } catch (err) {
    logLabeledError('kubectlConfigFunctions.createStackForWorkerNode', err);
    throw err;
  }
};

/** --------- INPUT NODE INSTANCE ROLE INTO THE was-auth-cm.yaml AND APPLY ---------
 * inputNodeInstance() will read create a .yaml file based on the NodeInstanceArn from
 * AWS and will then apply that file to the kubernetes cluster so that we are configured
 * to the nodes that were created
 * @param {String} clusterName
 * @return {undefined}
 */
const inputNodeInstance = async (clusterName) => {
  try {
    logWithLabel('Inside kubectlConfigFunctions.inputNodeInstance: ', clusterName);
    logStep('kubectlConfigFunctions.inputNodeInstance');
    logWithLabel('process.env.KUBECONFIG: ', process.env.KUBECONFIG);

    // read and parse masterFile
    console.log('!!!!!!!!!!!!!!!!!!!!!--------auth file time--------------!!!!!!!!!!!!!!!!!!!!!!!!!!');
    const awsMasterFileData = await fsp.readFile(
      `${process.env.AWS_STORAGE}AWS_Private/${clusterName}_MASTER_FILE.json`,
      'utf-8',
    );
    const parsedAWSMasterFileData = JSON.parse(awsMasterFileData);
    const { nodeInstanceRoleArn } = parsedAWSMasterFileData;
    logWithLabel('node instance role arn from master file: ', nodeInstanceRoleArn);

    // use nodeInstanceRoleArn to replace the template file with correct string and write the AUTH_FILE
    const workerNodeStackName = `${clusterName}-worker-node`;

    let nodeInstanceTemplate;
    if (NODE_ENV === 'development') {
      nodeInstanceTemplate = path.join(
        __dirname,
        '/../Storage/AWS_Assets/Policy_Documents/node-instance-template.yaml',
      );
    } else if (NODE_ENV === 'test') {
      nodeInstanceTemplate = path.join(
        __dirname,
        '/../Storage/AWS_Assets/Policy_Documents/node-instance-template.yaml',
      );
    } else {
      nodeInstanceTemplate = path.join(
        process.env.APP_PATH,
        '..',
        'extraResources',
        'node-instance-template.yaml',
      );
    }

    logWithLabel('\nnodeInstanceTemplate', nodeInstanceTemplate);

    const nodeInstanceTemplateRead = await fsp.readFile(nodeInstanceTemplate, 'utf-8');
    const updatedNodeInstanceTemplate = nodeInstanceTemplateRead.replace(
      /<NodeInstanceARN>/,
      nodeInstanceRoleArn,
    );
    console.log(
      '\njust wrote to file in storage..... \n',
      `${process.env.KUBECTL_STORAGE}/AUTH_FILE_${workerNodeStackName}.yaml\n`,
    );
    await fsp.writeFile(
      `${process.env.KUBECTL_STORAGE}/AUTH_FILE_${workerNodeStackName}.yaml`,
      updatedNodeInstanceTemplate,
    );
    const filePathToAuthFile = path.join(
      process.env.KUBECTL_STORAGE,
      `AUTH_FILE_${workerNodeStackName}.yaml`,
    );

    // Command Kubectl to configure by applying the AUTH_FILE
    const kubectlApplyChild = spawnSync('kubectl', ['apply', '-f', filePathToAuthFile], { env: process.env });
    const stdout = kubectlApplyChild.stdout.toString();
    const stderr = kubectlApplyChild.stderr.toString();
    console.log('stdout', stdout, 'stderr', stderr);
    if (stderr) throw new Error(stderr);

    // set a short timeout here to allow for the kubectl apply to take place
    console.log('waiting 5 seconds');
    await timeout(5000);
  } catch (err) {
    logLabeledError('kubectlConfigFunctions.inputNodeInstance: ', err);
    throw err;
  }
};

/** ----------- CHECK FOR SUCCESSFUL WORKER NODES CONFIGURATION ----------------
 * testKubectlStatus() will continue to checkout for worker nodes until they are ready
 * If an error occurs this will return false;
 * @return {Boolean}
 */
const testKubectlStatus = async () => {
  try {
    console.log('testing status');
    let stdout;
    let stderr;
    const getKubectlStatus = () => {
      console.log('getting status');
      const kubectlStatus = spawnSync('kubectl', ['get', 'nodes'], { timeout: 15000, env: process.env });
      stdout = kubectlStatus.stdout.toString();
      stderr = kubectlStatus.stderr.toString();
      console.log('stdout: ', `===>\n${stdout}\n`, 'stderr:', stderr);
      if (stderr) throw new Error(stderr);
    };
    console.log('get status');

    getKubectlStatus();
    while (stdout.includes('NotReady')) {
      console.log('stdout status: ', stdout);
      // wait 10 seconds before rerunning function
      await timeout(10000);
      getKubectlStatus();
    }
    if ((stdout.includes('Ready')) && (!stdout.includes('Not'))) {
      console.log('Kubectl successfully configured:', `====>\n${stdout}\n`, 'stderr:', stderr);
      return true;
    }
    return false;
    // return true;
  } catch (err) {
    logLabeledError('testKubectlStatus', err);
    return false;
  }
};

module.exports = {
  createConfigFile,
  configureKubectl,
  testKubectlGetSvc,
  createStackForWorkerNode,
  inputNodeInstance,
  testKubectlStatus,
};
