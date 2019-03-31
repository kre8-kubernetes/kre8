//* --------- NPM MODULES ----------------
require('dotenv').config();

//* --------- ELECTRON MODULES -----------
const { app, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');

//* --------- NODE APIS -------------------
const fs = require('fs');
const fsp = require('fs').promises;
const { spawnSync } = require('child_process');
const path = require('path');

//* --------- AWS SDK ELEMENTS ------------
// STS = AWS Security Token Service
const STS = require('aws-sdk/clients/sts');

//* --------- INSTANTIATE AWS CLASSES -----
const sts = new STS();

//* --------- IMPORT KRE8 MODULES ---------
const events = require('../eventTypes.js');
const awsProps = require(__dirname + '/awsPropertyNames'); 
const awsEventCallbacks = require(__dirname + '/helperFunctions/awsEventCallbacks'); 
const kubectlConfigFunctions = require(__dirname + '/helperFunctions/kubectlConfigFunctions');
const kubernetesTemplates = require(__dirname + '/helperFunctions/kubernetesTemplates');
const awsHelperFunctions = require(__dirname + '/helperFunctions/awsHelperFunctions'); 

//* --------- .ENV Variables --------------
const { PORT, REACT_DEV_TOOLS_PATH } = process.env;

console.time('init');

//* --------- CREATE WINDOW OBJECT -------------------------------------------- *//

// Declare window objects
let win;

/*
* Invoked with app.on('ready'):
* Insures IAM Authenticator is installed and configured,
* sets necessary environment variables
* creates application window, serves either dev or production version of app and
*/

const createWindowAndSetEnvironmentVariables = () => {
  // TODO: add to application package
  awsEventCallbacks.installAndConfigureAWS_IAM_Authenticator();
  if (isDev) {
    BrowserWindow.addDevToolsExtension(REACT_DEV_TOOLS_PATH);
    process.env.APPLICATION_PATH = __dirname;

    awsEventCallbacks.setEnvVarsAndMkDirsInDev();
  } else {
    awsEventCallbacks.setEnvVarsAndMkDirsInProd();
    // TODO: Braden check if we need to create directories, or if we can do in the configuration of electron we do it then
  }

  /*
  * If awsCredentials file has already been created, use data to set additional required
  * AWS Environment Variables AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, REGION
  */

  // awsEventCallbacks.checkAWSCredentials();

  if (fs.existsSync(`${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`)) {
    const readCredentialsFile = fs.readFileSync(`${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`, 'utf-8');
    const parsedCredentialsFile = JSON.parse(readCredentialsFile);

    Object.entries(parsedCredentialsFile).forEach((arr, index) => {
      if (index < 4) {
        process.env[arr[0]] = arr[1];
      }
      if (index === 4) {
        process.env.KUBECONFIG = `${process.env.HOME}/.kube/config-${arr[1]}`;
      }
    });
  }

  win = new BrowserWindow({
    show: false,
    height: 720,
    width: 930,
    minHeight: 550,
    minWidth: 700,
    backgroundColor: '#243B55',
    center: true,
  });

  win.loadURL(isDev ? `http://localhost:${PORT}` : `file://${path.join(__dirname, 'dist/index.html')}`);
  win.once('ready-to-show', () => {
    win.show();
    childWin.close();
    console.timeEnd('init');
  });

  win.on('closed', () => { win = null; });

  // Creates the child window that appears during initial loading of the application
  let childWin = new BrowserWindow({
    height: 325,
    width: 325,
    maxHeight: 325,
    maxWidth: 325,
    minHeight: 325,
    minWidth: 325,
    parent: win,
    show: true,
    frame: false,
    backgroundColor: '#141E30',
    center: true,
  });

  childWin.loadURL(`file://${path.join(__dirname, '../src/childWindow/childIndex.html')}`);

  childWin.once('ready-to-show', () => {
    childWin.show();
  });

  childWin.on('closed', () => {
    childWin = null;
  });

  // Creates browser window that displays Kubernetes Docs when user clicks more info while creating a pod, service or deployment
  let kubeDocsDeploymentWindow = new BrowserWindow({
    width: 600,
    height: 400,
    show: false,
  });

  kubeDocsDeploymentWindow.loadURL('https://kubernetes.io/docs/concepts/workloads/controllers/deployment/');
  ipcMain.on(events.SHOW_KUBE_DOCS_DEPLOYMENT, () => {
    kubeDocsDeploymentWindow.show();
  });

  kubeDocsDeploymentWindow.on('close', () => {
    kubeDocsDeploymentWindow.hide();
  });
};

//* ------- EXECUTES ON EVERY OPENING OF APPLICATION -------------------------- **//
//* ------- Check credentials file to determine if user needs to configure the application *//

ipcMain.on(events.CHECK_CREDENTIAL_STATUS, async (event, data) => {
  try {
    const credentialStatusToReturn = await awsEventCallbacks.returnKubectlAndCredentialsStatus(data);
    win.webContents.send(events.RETURN_CREDENTIAL_STATUS, credentialStatusToReturn);
  } catch (err) {
    console.error('FROM CHECK_CREDENTIALS_STATUS:', err);
    win.webContents.send(events.RETURN_CREDENTIAL_STATUS, 'Credentials have not yet been set, or there is an error with the file');
  }
});

//* --------- EXECUTES ON USER'S FIRST INTERACTION WITH APP ---------------- *//
//* --------- Verifies and Configures User's AWS Credentials --------------- *//

/*
* Function fires when user submits AWS credential information on homepage
* Writes credentials to file, sets environment variables with data from user,
* verifies with AWS API that credentials were correct, if so user is advanced to
* next setup page; otherwise, user is asked to retry entering credentials
*/

ipcMain.on(events.SET_AWS_CREDENTIALS, async (event, data) => {
  console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
  console.log('=============  SET_AWS_CREDENTIALS Fucntion fired ===================');
  console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

  try {
    awsEventCallbacks.configureAWSCredentials(data);
    let credentialStatus = await sts.getCallerIdentity().promise();

    if (credentialStatus.Arn) {
      await awsHelperFunctions.updateCredentialsFile(awsProps.AWS_CREDENTIALS_STATUS, awsProps.AWS_CREDENTIALS_STATUS_CONFIGURED);
      win.webContents.send(events.HANDLE_AWS_CREDENTIALS, credentialStatus);
    } else {
      credentialStatus = false;
      win.webContents.send(events.HANDLE_AWS_CREDENTIALS, credentialStatus);
    }
  } catch (err) {
    console.error(err);
  }
});

//* --- AWS SDK EVENTS--------------------------------------------------------------------- *//
//* --- EXECUTES ON FIRST INTERACTION WITH APP WHEN USER SUBMITS DATA FROM AWS CONTAINER -- *//
//* --- Takes 10 - 15 minutes to complete ------------------------------------------------- *//
//* --- Creates AWS account components: IAM Role, Stack, Cluster, Worker Node Stack ------- *//
ipcMain.on(events.CREATE_CLUSTER, async (event, data) => {

  const iamRoleStatus = {};
  const vpcStackStatus = {};
  const clusterStatus = {};
  const workerNodeStatus = {};
  const kubectlConfigStatus = {};
  const errorData = {};

  try {
    // Set CLUSTER_NAME environment variable based on user input and save to credentials file
    process.env.CLUSTER_NAME = data.clusterName;

    await awsHelperFunctions.updateCredentialsFile(awsProps.CLUSTER_NAME, data.clusterName);

    //* --------- CREATE AWS IAM ROLE + ATTACH POLICY DOCS ---------------------------
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log('============  ipcMain.on(events.CREATE_IAM_ROLE)... =================');
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

    // Send data to AWS to create IAM Role, timing: 10 - 30 seconds
    await awsEventCallbacks.createIAMRole(data.iamRoleName);

    iamRoleStatus.type = awsProps.IAM_ROLE_STATUS;
    iamRoleStatus.status = awsProps.CREATED;
    // Send status to front end to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, iamRoleStatus);

    vpcStackStatus.type = awsProps.VPC_STACK_STATUS;
    vpcStackStatus.status = awsProps.CREATING;
    win.webContents.send(events.HANDLE_STATUS_CHANGE, vpcStackStatus);
  } catch (err) {
    console.error('Error from CREATE_IAM_ROLE in main.js:', err);
    errorData.type = awsProps.IAM_ROLE_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating IAM Role: ${err}`;

    win.webContents.send(events.HANDLE_ERRORS, errorData);
  }

  //* ------ CREATE AWS STACK ---- *//
  // Takes approx 1 - 1.5 mins to create stack and get data back from AWS
  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log('============  ipcMain.on(events.CREATE_TECH_STACK),... ==============');
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

    const { vpcStackName } = data;

    await awsEventCallbacks.createVPCStack(vpcStackName, data.iamRoleName);

    vpcStackStatus.status = awsProps.CREATED;
    console.log('vpcStackStatus: ', vpcStackStatus);
    win.webContents.send(events.HANDLE_STATUS_CHANGE, vpcStackStatus);

    clusterStatus.type = awsProps.CLUSTER_STATUS;
    clusterStatus.status = awsProps.CREATING;
    win.webContents.send(events.HANDLE_STATUS_CHANGE, clusterStatus);
  } catch (err) {
    console.error('Error from CREATE_TECH_STACK: in main.js: ', err);
    errorData.type = awsProps.VPC_STACK_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating VPC Stack: ${err}`;
    win.webContents.send(events.HANDLE_ERRORS, errorData);
  }

  //* --------- CREATE AWS CLUSTER ---------------------------------- *//
  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log('============  ipcMain.on(events.CREATE_CLUSTER),... =================');
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

    await awsEventCallbacks.createCluster(data.clusterName);
    clusterStatus.status = awsProps.CREATED;
    win.webContents.send(events.HANDLE_STATUS_CHANGE, clusterStatus);

    workerNodeStatus.type = awsProps.WORKER_NODE_STATUS;
    workerNodeStatus.status = awsProps.CREATING;
    win.webContents.send(events.HANDLE_STATUS_CHANGE, workerNodeStatus);
  } catch (err) {
    console.error('Error from CLUSTER_STATUS: in main.js: ', err);
    errorData.type = awsProps.CLUSTER_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating Cluster: ${err}`;

    win.webContents.send(events.HANDLE_ERRORS, errorData);
  }

  //* ----- CREATE KUBECONFIG FILE, CONFIGURE KUBECTL, CREATE WORKER NODE STACK ---------- *//
  try {
    await kubectlConfigFunctions.createConfigFile(data.clusterName);
    await kubectlConfigFunctions.configureKubectl(data.clusterName);
    kubectlConfigFunctions.testKubectlGetSvc(data.clusterName);
    await kubectlConfigFunctions.createStackForWorkerNode(data.clusterName);

    workerNodeStatus.status = awsProps.CREATED;
    win.webContents.send(events.HANDLE_STATUS_CHANGE, workerNodeStatus);

    kubectlConfigStatus.type = awsProps.KUBECTL_CONFIG_STATUS;
    kubectlConfigStatus.status = awsProps.CREATING;
    win.webContents.send(events.HANDLE_STATUS_CHANGE, kubectlConfigStatus);
  } catch (err) {
    console.error('Error from CREATE_TECH_STACK: in main.js: ', err);
    errorData.type = awsProps.WORKER_NODE_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating Worker Node Stack: ${err}`;
    win.webContents.send(events.HANDLE_ERRORS, errorData);
  }

  //* ----- CREATE NODE INSTANCE AND TEST KUBECTL CONFIG STATUS ---------- *//
  try {
    await kubectlConfigFunctions.inputNodeInstance(data.clusterName);
    const kubectlConfigStatusTest = await kubectlConfigFunctions.testKubectlStatus();

    if (kubectlConfigStatusTest === true) {
      kubectlConfigStatus.status = awsProps.CREATED;

      win.webContents.send(events.HANDLE_STATUS_CHANGE, kubectlConfigStatus);
      win.webContents.send(events.HANDLE_NEW_NODES, kubectlConfigStatusTest);
    } else {
      win.webContents.send(events.HANDLE_ERRORS, 'An error ocurred while configuring kubectl');
    }
  } catch (err) {
    console.error('Error from configuring Kubectl', err);
    errorData.type = awsProps.KUBECTL_CONFIG_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while configuring kubectl: ${err}`;

    win.webContents.send(events.HANDLE_ERRORS, errorData);
  }
});


//* --------------------------------------------------------------------------- *//
//* ----------------------- FUNCTION TO SEND CLUSTER DATA TO DISPLAY ---------- *//
//* --------------------------------------------------------------------------- *//

//* ------- EXECUTES ON EVERY OPENING OF APPLICATION -------------------------- *//
/*
* Check credentials file to determine if user needs to configure the application
* If credential's file hasn't been created yet (meaning user hasn't entered credentials previously),
* serve HomeComponent page, else, serve HomeComponentPostCredentials
*/
ipcMain.on(events.GET_CLUSTER_DATA, async (event, data) => {
  try {
    const dataFromCredentialsFile = await fsp.readFile(`${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`, 'utf-8');

    const parsedCredentialsFileData = JSON.parse(dataFromCredentialsFile);
    const { clusterName } = parsedCredentialsFileData;

    const dataFromMasterFile = await fsp.readFile(`${process.env.AWS_STORAGE}AWS_Private/${clusterName}_MASTER_FILE.json`, 'utf-8');
    const parsedAWSMasterFileData = JSON.parse(dataFromMasterFile);
    delete parsedAWSMasterFileData.certificateAuthorityData;

    win.webContents.send(events.SEND_CLUSTER_DATA, parsedAWSMasterFileData);
  } catch (err) {
    console.error(err);
  }
});

//* --------------------------------------------------------------------------- *//
//* ----------------------- KUBECTL EVENTS ------------------------------------ *//
//* --------------------------------------------------------------------------- *//

//* ---------- Get the Master Node ------------------- *//
/*
* run 'kubectl get svc -o=json' to get the services, one element in the item array will contain
* the apiserver. result.items[x].metadata.labels.component = 'apiserver'
*/
ipcMain.on(events.GET_MASTER_NODE, async (event, data) => {
  try {
    // run kubctl
    const apiServiceData = spawnSync('kubectl', ['get', 'svc', '-o=json']);
    // string the data and log to the console;
    const stdout = apiServiceData.stdout.toString();
    const stdoutParsed = JSON.parse(stdout);

    const stderr = apiServiceData.stderr.toString();
    if (stderr) throw stderr;

    const clusterApiData = stdoutParsed.items.find(item => item.metadata.labels.component === 'apiserver');
    win.webContents.send(events.HANDLE_MASTER_NODE, clusterApiData);
  } catch (err) {
    console.error('From GET_MASTER_NODE:', err);
    win.webContents.send(events.HANDLE_MASTER_NODE, err);
  }
});

//* -------------- Get Worker Nodes -------------------- *//
ipcMain.on(events.GET_WORKER_NODES, async (event, data) => {
  try {
    const apiNodeData = spawnSync('kubectl', ['get', 'nodes', '-o=json']);
    const stdout = apiNodeData.stdout.toString();
    const stdoutParsed = JSON.parse(stdout);

    const stderr = apiNodeData.stderr.toString();
    if (stderr) throw stderr;

    win.webContents.send(events.HANDLE_WORKER_NODES, stdoutParsed);
  } catch (err) {
    console.error('From GET_WORKER_NODES:', err);
    win.webContents.send(events.HANDLE_WORKER_NODES, err);
  }
});


//* -------------- Get the Containers and Pods -------------------- *//

ipcMain.on(events.GET_CONTAINERS_AND_PODS, async (event, data) => {
  try {
    const apiNodeData = spawnSync('kubectl', ['get', 'pods', '-o=json']);
    const stdout = apiNodeData.stdout.toString();
    const stdoutParsed = JSON.parse(stdout);

    const stderr = apiNodeData.stderr.toString();
    if (stderr) throw stderr;

    win.webContents.send(events.HANDLE_CONTAINERS_AND_PODS, stdoutParsed);
  } catch (err) {
    console.error('From GET_CONTAINERS_AND_PODS:', err);
    win.webContents.send(events.HANDLE_CONTAINERS_AND_PODS, err);
  }
});

//* ----------- CREATE A POD -------------------------------- *//
/*
* Pass user input into createPodYamlTemplate method to generate template
* Create a pod based on that template, launch pod via kubectl
*/
ipcMain.on(events.CREATE_POD, async (event, data) => {
  try {
    // CREATE AND WRITE THE POD FILE FROM TEMPLATE
    const podYamlTemplate = kubernetesTemplates.createPodYamlTemplate(data);
    const stringifiedPodYamlTemplate = JSON.stringify(podYamlTemplate, null, 2);
    await fsp.writeFile(`${process.env.KUBECTL_STORAGE}pod_${data.podName}.json`, stringifiedPodYamlTemplate);
    // CREATE THE POD VIA kubectl
    const child = spawnSync('kubectl', ['apply', '-f', `${process.env.KUBECTL_STORAGE}pod_${data.podName}.json`]);
    const stdout = child.stdout.toString();

    const stderr = child.stderr.toString();
    if (stderr) throw stderr;

    // SEND STDOUT TO RENDERER PROCESS
    await awsHelperFunctions.timeout(1000 * 5);
    win.webContents.send(events.HANDLE_NEW_POD, stdout);
  } catch (err) {
    console.error('From CREATE_POD:', err);
  }
});

//* ----- DELETE A NODE ---------- **//
ipcMain.on(events.DELETE_NODE, async (event, data) => {
  try {
    // DELETE THE POD VIA kubectl
    const deploymentName = data.data.name.split('-')[0];
    const child = spawnSync('kubectl', ['delete', 'deployment', deploymentName]);
    const stdout = child.stdout.toString();

    const stderr = child.stderr.toString();
    if (stderr) throw stderr;
    // SEND STDOUT TO RENDERER PROCESS
    await awsHelperFunctions.timeout(1000 * 10);
    win.webContents.send(events.HANDLE_RERENDER_NODE, stdout);
  } catch (err) {
    console.error('From DELETE_NODE:', err);
  }
});


//* -----------------------SERVICE--------------------------------**//

// BUILD A SERVICE YAML
ipcMain.on(events.CREATE_SERVICE, async (event, data) => {
  try {
    console.log('CREATE_SERVICE data:', data);
    // CREATE AND WRITE THE SERVICE FILE FROM TEMPLATE
    const serviceYamlTemplate = kubernetesTemplates.createServiceYamlTemplate(data);
    const stringifiedServiceYamlTemplate = JSON.stringify(serviceYamlTemplate, null, 2);
    await fsp.writeFile(`${process.env.KUBECTL_STORAGE}service_${data.serviceName}.json`, stringifiedServiceYamlTemplate);
    // CREATE THE SERVICE VIA kubectl
    const child = spawnSync('kubectl', ['apply', '-f', `${process.env.KUBECTL_STORAGE}service_${data.serviceName}.json`]);
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();
    if (stderr) throw stderr;
    // SEND STDOUT TO RENDERER PROCESS
    win.webContents.send(events.HANDLE_NEW_SERVICE, stdout);
  } catch (err) {
    console.error('From CREATE_SERVICE', err);
  }
});

//* -------------- CREATE A DEPLOYMENT----------------- *//

ipcMain.on(events.CREATE_DEPLOYMENT, async (event, data) => {
  try {
    // START LOADING ICON
    let startingIcon = new BrowserWindow({
      height: 325,
      width: 325,
      maxHeight: 325,
      maxWidth: 325,
      minHeight: 325,
      minWidth: 325,
      parent: win,
      show: false,
      frame: false,
      backgroundColor: '#141E30',
      center: true,
    });
    startingIcon.loadURL(`file://${path.join(__dirname, '../src/childWindow/childIndex.html')}`);
    startingIcon.show();

    // START CREATING DEPLOYMENT
    if (data.replicas > 5) throw new Error(`Replica amount entered was ${data.replicas}. This value has to be 5 or less.`);
    // CREATE AND WRITE THE DEPLOYMENT FILE FROM TEMPLATE
    const deploymentYamlTemplate = kubernetesTemplates.createDeploymentYamlTemplate(data);
    const stringifiedDeploymentYamlTemplate = JSON.stringify(deploymentYamlTemplate, null, 2);
    await fsp.writeFile(`${process.env.KUBECTL_STORAGE}deployment_${data.deploymentName}.json`, stringifiedDeploymentYamlTemplate);
    // CREATE THE DEPOYMENT VIA kubectl
    const child = spawnSync('kubectl', ['create', '-f', `${process.env.KUBECTL_STORAGE}deployment_${data.deploymentName}.json`]);
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();
    if (stderr) throw stderr;
    // SEND STDOUT TO RENDERER PROCESS
    await awsHelperFunctions.timeout(1000 * 10);
    win.webContents.send(events.HANDLE_NEW_DEPLOYMENT, stdout);
    win.webContents.send(events.HANDLE_RERENDER_NODE, 'handle rerender node for create deployment');
    startingIcon.close();
  } catch (err) {
    console.error('From CREATE_DEPLOYMENT', err);
  }
});

//* --------- APPLICATION OBJECT EVENT EMITTERS ---------- *//

// HANDLE app ready
app.on('ready', createWindowAndSetEnvironmentVariables);

// HANDLE app shutdown
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindowAndSetEnvironmentVariables();
  }
});
