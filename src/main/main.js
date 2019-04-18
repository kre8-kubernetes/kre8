// --------- NPM MODULES ----------------
require('dotenv').config();

// --------- ELECTRON MODULES -----------
const { app, BrowserWindow, ipcMain, shell, Menu, crashReporter } = require('electron');

crashReporter.start({
  productName: 'kre8-awslaunched',
  companyName: 'kre8',
  submitURL: ' ',
  uploadToServer: false,
  crashesDirectory: `${process.env.HOME}/desktop`,
});

process.env.APP_PATH = app.getAppPath();

// --------- NODE APIS -------------------
const fs = require('fs');
const fsp = require('fs').promises;
const { spawnSync } = require('child_process');
const path = require('path');

// --------- AWS SDK ELEMENTS ------------
// STS = AWS Security Token Service
const STS = require('aws-sdk/clients/sts');
const sts = new STS({ signatureCache: false });

// --------- IMPORT KRE8 MODULES ---------
const events = require('../eventTypes.js');
const awsProps = require(__dirname + '/awsPropertyNames'); 
const awsEventCallbacks = require(__dirname + '/helperFunctions/awsEventCallbacks'); 
const kubectlConfigFunctions = require(__dirname + '/helperFunctions/kubectlConfigFunctions');
const kubernetesTemplates = require(__dirname + '/helperFunctions/kubernetesTemplates');
const awsHelperFunctions = require(__dirname + '/helperFunctions/awsHelperFunctions'); 

// --------- .ENV Variables --------------
const { PORT, REACT_DEV_TOOLS_PATH, NODE_ENV } = process.env;


// --------- CREATE WINDOW OBJECT --------------------------------------------

// Declare window object
let win;

/** ------------ FUNCTION CALLED WHEN APP IS 'Ready' --------------------
 * Invoked with app.on('ready'):
 * Insures IAM Authenticator is installed and configured,
 * sets necessary environment variables
 * creates application window, serves either dev or production version of app and
 * @return {undefined}
*/
const createWindowAndSetEnvironmentVariables = () => {
  awsEventCallbacks.installAndConfigureAWS_IAM_Authenticator();
  if (NODE_ENV === 'development') {
    process.env.APPLICATION_PATH = __dirname;
    awsEventCallbacks.setEnvVarsAndMkDirsInDev();
    BrowserWindow.addDevToolsExtension(REACT_DEV_TOOLS_PATH);
  } else if (NODE_ENV === 'test') {
    process.env.APPLICATION_PATH = __dirname;
    awsEventCallbacks.setEnvVarsAndMkDirsInDev();
  } else {
    // TODO: Braden check if we need to create directories, or if we can do in the configuration of electron we do it then
    awsEventCallbacks.setEnvVarsAndMkDirsInProd();
  }

  /*
  * If awsCredentials file has already been created, use data to set additional required
  * AWS Environment Variables AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, REGION
  */
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

  // create the main window
  win = new BrowserWindow({
    show: false,
    height: 720,
    width: 930,
    minHeight: 620,
    minWidth: 700,
    backgroundColor: '#243B55',
    center: true,
    defaultFontFamily: 'sansSerif',
    title: 'MAIN',
  });

  win.webContents.on('will-navigate', (event, url) => {
    event.preventDefault();
    console.log('url: ', url);
    if (url.includes('amazon') || url.includes('kubernetes')) {
      shell.openExternal(url);
    }
  });

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
    backgroundColor: '#1F3248',
    center: true,
    title: 'LOADING',
  });

  // set the win event listeners after create the child window
  win.once('ready-to-show', () => {
    win.show();
    childWin.close();
    // console.timeEnd('init');
  });
  win.on('closed', () => { win = null; });

  // load the child window and set the listeners
  childWin.loadURL(`file://${path.join(__dirname, '../client/childWindow/childIndex.html')}`);
  childWin.webContents.on('dom-ready', () => {
    // show the child window when ready to show
    childWin.show();
    // load the renderer url onto window after the child window is ready to show
    const urlPath = `file://${path.join(__dirname, '..', '..', 'dist/index.html')}`;
    console.log('\nNODE_ENV ========================> ', NODE_ENV);
    console.log('\nAPPLICATION PATH ================> ', process.env.APPLICATION_PATH);
    console.log('\nSTORAGE =========================> ', process.env.AWS_STORAGE);
    if (NODE_ENV === 'development') {
      win.loadURL(`http://localhost:${PORT}`);
      win.webContents.openDevTools();
    } else if (NODE_ENV === 'test') {
      win.loadURL(urlPath);
    } else {
      win.loadURL(urlPath);
      win.webContents.openDevTools();
    }
  });

  childWin.on('closed', () => {
    childWin = null;
  });
};

/** ------- EXECUTES ON EVERY OPENING OF APPLICATION --------------------------
 * Check credentials file to determine if user needs to configure the application
 * @param {Object} event
 * @param {String} data
 * @returns {Boolean} emits to RETURN_CREDENTIAL_STATUS listener
 */
ipcMain.on(events.CHECK_CREDENTIAL_STATUS, async (event, data) => {
  try {
    const credentialStatusToReturn = await awsEventCallbacks.returnKubectlAndCredentialsStatus();
    win.webContents.send('error', process.env);
    win.webContents.send(events.RETURN_CREDENTIAL_STATUS, credentialStatusToReturn);
  } catch (err) {
    console.error('FROM CHECK_CREDENTIALS_STATUS:', err);
    win.webContents.send(events.RETURN_CREDENTIAL_STATUS, 'Credentials have not yet been set, or there is an error with the file');
    win.webContents.send('error', { from: 'CHECK_CREDENTIAL_STATUS', message: err });
  }
});

/** --------- EXECUTES ON USER'S FIRST INTERACTION WITH APP ----------------
 *  --------- Verifies and Configures User's AWS Credentials ---------------
 * Function fires when user submits AWS credential information on homepage
 * Writes credentials to file, sets environment variables with data from user,
 * verifies with AWS API that credentials were correct, if so user is advanced to
 * next setup page; otherwise, user is asked to retry entering credentials
 * @param {Object} event
 * @param {Object} data AWS credentials
 * @return {Object/Boolean} emits the object back from AWS if confirms otherwise emits false
*/
ipcMain.on(events.SET_AWS_CREDENTIALS, async (event, data) => {
  console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
  console.log('=============  SET_AWS_CREDENTIALS Fucntion fired ===================');
  console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
  let loadingChildWindow;

  try {
    const currentParentPosition = win.getPosition();
    const currentParentSize = win.getSize();
    const childX = Math.floor(currentParentPosition[0] + (currentParentSize[0] / 2) - (325 / 2));
    const childY = Math.floor((currentParentPosition[1] + (currentParentSize[1] / 2) - (325 / 2)));

    loadingChildWindow = new BrowserWindow({
      height: 325,
      width: 325,
      maxHeight: 325,
      maxWidth: 325,
      minHeight: 325,
      minWidth: 325,
      parent: win,
      show: true,
      frame: false,
      center: false,
      backgroundColor: '#1F3248',
      x: childX,
      y: childY,
    });

    loadingChildWindow.loadURL(`file://${path.join(__dirname, '../src/childWindow/childIndex.html')}`);
    await awsEventCallbacks.configureAWSCredentials(data);

    /**
     * Sets the credentials to null in sts object, because AWS caches the access key from a correct login
     * and will not check if the secrect access key changed in relation to the access key. This could lead to
     * an issue if the user put in their secret access key in wrong the first time or would like to change their
     * credentials.
     */
    sts.config.credentials = null;
    const credentialStatus = await sts.getCallerIdentity().promise();

    if (credentialStatus.Arn) {
      loadingChildWindow.close();
      await awsHelperFunctions.updateCredentialsFile(awsProps.AWS_CREDENTIALS_STATUS, awsProps.AWS_CREDENTIALS_STATUS_CONFIGURED);
      win.webContents.send(events.HANDLE_AWS_CREDENTIALS, credentialStatus);
    }
  } catch (err) {
    console.error('From SET_AWS_CREDENTIALS:', err);
    loadingChildWindow.close();
    loadingChildWindow = null;
    win.webContents.send(events.HANDLE_AWS_CREDENTIALS, 'Login details were incorrect. Please check your credentials and try again.');
    win.webContents.send('error', { from: 'SET_AWS_CREDENTIALS', message: err });
  }
});


/**  ---------------- AWS SDK EVENTS---------------------------------
 * createCluster() executes on the first interaction with the app when user submits data from
 * the AWS container from the renderer thread. The whole process will take approximately 10-15 minutes
 * This will create an IAM Role, a VPC stack, an EKS Cluster, and a Stack for EC2 worker nodes.
 * @param {Object} event
 * @param {Object} data - this is an object container role name, VPC name and cluster name
 * @return {Object} - this will continuously emit status object back to communicate with the renderer
 * thread, where in the process this function is at. Done to better inform user.
 */
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

    // -------------- CREATE AWS IAM ROLE + ATTACH POLICY DOCS -------------------------
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log('============  ipcMain.on(events.CREATE_IAM_ROLE)... =================');
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

    // Send data to AWS to create IAM Role, timing: 10 - 30 seconds
    await awsEventCallbacks.createIAMRole(data.iamRoleName);

    iamRoleStatus.type = awsProps.IAM_ROLE_STATUS;
    iamRoleStatus.status = awsProps.CREATED;
    // Send IAM Role status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, iamRoleStatus);

    vpcStackStatus.type = awsProps.VPC_STACK_STATUS;
    vpcStackStatus.status = awsProps.CREATING;
    // Send VPC Stack status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, vpcStackStatus);
  } catch (err) {
    console.error('Error from CREATE_IAM_ROLE in index.js:', err);
    errorData.type = awsProps.IAM_ROLE_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating IAM Role: ${err}`;
    // Send error status to render thread to display
    win.webContents.send(events.HANDLE_ERRORS, errorData);
    win.webContents.send('error', { from: 'CREATE_CLUSTER--CREATE_IAM_ROLE', message: err });
  }

  // ---------------------- CREATE AWS STACK (approx 1 - 1.5 mins) -------------------
  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log('============  ipcMain.on(events.CREATE_TECH_STACK),... ==============');
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

    const { vpcStackName } = data;
    
    // Send data to AWS to create VPC Stack, timing: 30 seconds - 1 minute
    await awsEventCallbacks.createVPCStack(vpcStackName);

    vpcStackStatus.status = awsProps.CREATED;
    console.log('vpcStackStatus: ', vpcStackStatus);
    // Send VPC Stack status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, vpcStackStatus);

    clusterStatus.type = awsProps.CLUSTER_STATUS;
    clusterStatus.status = awsProps.CREATING;
    // Send Cluster status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, clusterStatus);
  } catch (err) {
    console.error('Error from CREATE_TECH_STACK: in index.js: ', err);
    errorData.type = awsProps.VPC_STACK_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating VPC Stack: ${err}`;
    // Send Error message to render thread to display
    win.webContents.send(events.HANDLE_ERRORS, errorData);
    win.webContents.send('error', { from: 'CREATE_CLUSTER--CREATE_TECH_STACK', message: err });
  }

  // ------------------------ CREATE AWS CLUSTER --------------------------------------
  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log('============  ipcMain.on(events.CREATE_CLUSTER),... =================');
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

    await awsEventCallbacks.createCluster(data.clusterName);
    clusterStatus.status = awsProps.CREATED;
    // Send Cluster status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, clusterStatus);

    workerNodeStatus.type = awsProps.WORKER_NODE_STATUS;
    workerNodeStatus.status = awsProps.CREATING;
    // Send Worker Node status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, workerNodeStatus);
  } catch (err) {
    console.error('Error from CLUSTER_STATUS: in index.js: ', err);
    errorData.type = awsProps.CLUSTER_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating Cluster: ${err}`;
    // Send Error message to render thread to display
    win.webContents.send(events.HANDLE_ERRORS, errorData);
    win.webContents.send('error', { from: 'CREATE_CLUSTER--CREATE_CLUSTER', message: err });
  }

  // ----- CREATE KUBECONFIG FILE, CONFIGURE KUBECTL, CREATE WORKER NODE STACK ----------
  try {
    await kubectlConfigFunctions.createConfigFile(data.clusterName);
    await kubectlConfigFunctions.configureKubectl(data.clusterName);
    // kubectlConfigFunctions.testKubectlGetSvc();
    await kubectlConfigFunctions.createStackForWorkerNode(data.clusterName);

    workerNodeStatus.status = awsProps.CREATED;
    // Send Worker Node status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, workerNodeStatus);

    kubectlConfigStatus.type = awsProps.KUBECTL_CONFIG_STATUS;
    kubectlConfigStatus.status = awsProps.CREATING;
    // Send kubectl status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, kubectlConfigStatus);
  } catch (err) {
    console.error('Error from CREATE_TECH_STACK: in index.js: ', err);
    errorData.type = awsProps.WORKER_NODE_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating Worker Node Stack: ${err}`;
    // Send error message to render thread to display
    win.webContents.send(events.HANDLE_ERRORS, errorData);
    win.webContents.send('error', { from: 'CREATE_CLUSTER--CREATE_WORKER_NODE_STACK', message: err });
  }

  // --------- CREATE NODE INSTANCE AND TEST KUBECTL CONFIG STATUS -------------
  try {
    await kubectlConfigFunctions.inputNodeInstance(data.clusterName);
    const kubectlConfigStatusTest = await kubectlConfigFunctions.testKubectlStatus();

    if (kubectlConfigStatusTest === true) {
      kubectlConfigStatus.status = awsProps.CREATED;
      // Send kubectl status to render thread to display
      win.webContents.send(events.HANDLE_STATUS_CHANGE, kubectlConfigStatus);
      // Send instructions to render thread to generate graph
      win.webContents.send(events.HANDLE_NEW_NODES, kubectlConfigStatusTest);
    } else {
      // Send error message to render thread to display
      win.webContents.send(events.HANDLE_ERRORS, 'An error ocurred while configuring kubectl');
    }
  } catch (err) {
    console.error('Error from configuring Kubectl', err);
    errorData.type = awsProps.KUBECTL_CONFIG_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while configuring kubectl: ${err}`;
    // Send error message to render thread to display
    win.webContents.send(events.HANDLE_ERRORS, errorData);
    win.webContents.send('error', { from: 'CREATE_CLUSTER--CREATE_NODE_&&_CONFIG_KUBECTL', message: err });
  }
});

/**
 * ---------------------------------------------------------------------------
 * --------------- FUNCTION TO SEND CLUSTER DATA TO DISPLAY ------------------
 * ---------------------------------------------------------------------------
 */

// -------------- EXECUTES ON EVERY OPENING OF APPLICATION -------------------
/**
 * Check credentials file to determine if user needs to configure the application
 * If credential's file hasn't been created yet (meaning user hasn't entered credentials previously),
 * serve HomeComponent page, else, serve HomeComponentPostCredentials
 * @param {Object} event
 * @return {Object} - object containing information from masterFile
*/
ipcMain.on(events.GET_CLUSTER_DATA, async (event) => {
  try {
    const dataFromCredentialsFile = await fsp.readFile(`${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`, 'utf-8');

    const parsedCredentialsFileData = JSON.parse(dataFromCredentialsFile);
    const { clusterName } = parsedCredentialsFileData;

    const dataFromMasterFile = await fsp.readFile(`${process.env.AWS_STORAGE}AWS_Private/${clusterName}_MASTER_FILE.json`, 'utf-8');
    const parsedAWSMasterFileData = JSON.parse(dataFromMasterFile);
    delete parsedAWSMasterFileData.certificateAuthorityData;
    // Send cluster data to render thread to generate graph
    win.webContents.send(events.SEND_CLUSTER_DATA, parsedAWSMasterFileData);
  } catch (err) {
    console.error('From GET_CLUSTER_DATA', err);
    win.webContents.send('error', { from: 'GET_CLUSTER_DATA', message: err });
  }
});

/**
 * ---------------------------------------------------------------------------
 * ----------------------- KUBECTL EVENTS ------------------------------------
 * ---------------------------------------------------------------------------
*/

/** ---------- Get the Master Node -------------------
 * The following run 'kubectl get [component] -o=json' to get the services, one element in the item
 * array will contain the apiserver. result.items[x].metadata.labels.component = 'apiserver'
 * @param {Object} event
 * @param {String} data
 * @return {Object} - apiserver information from kubernetes api
*/
ipcMain.on(events.GET_MASTER_NODE, async (event, data) => {
  try {
    // command kubctl to get service data
    const apiServiceData = spawnSync('kubectl', ['get', 'svc', '-o=json'], { env: process.env });
    // string the data and log to the console;
    const stdout = apiServiceData.stdout.toString();
    const stdoutParsed = JSON.parse(stdout);
    const stderr = apiServiceData.stderr.toString();
    win.webContents.send('error', apiServiceData);
    // win.webContents.send('kubectl', { stdout, stderr });
    if (stderr) throw stderr;
    const clusterApiData = stdoutParsed.items.find((item) => {
      if (item.metadata.labels) {
        return item.metadata.labels.component === 'apiserver';
      }
    });
    // return service data to the render thread
    win.webContents.send(events.HANDLE_MASTER_NODE, clusterApiData);
  } catch (err) {
    console.error('From GET_MASTER_NODE:', err);
    // send error message to the render thread to display
    win.webContents.send(events.HANDLE_MASTER_NODE, err);
    win.webContents.send('error', { from: 'CREATE_CLUSTER--GET MASTER NODE', message: err });
  }
});

// -------------- Get Worker Nodes --------------------
ipcMain.on(events.GET_WORKER_NODES, async (event, data) => {
  try {
    const apiNodeData = spawnSync('kubectl', ['get', 'nodes', '-o=json'], { env: process.env });
    const stdout = apiNodeData.stdout.toString();
    const stdoutParsed = JSON.parse(stdout);
    const stderr = apiNodeData.stderr.toString();

    win.webContents.send('error', stderr);
    if (stderr) throw stderr;
    // return worker node data to the render thread
    win.webContents.send(events.HANDLE_WORKER_NODES, stdoutParsed);
  } catch (err) {
    console.error('From GET_WORKER_NODES:', err);
    // send error message to the render thread to display
    win.webContents.send(events.HANDLE_WORKER_NODES, err);
  }
});

// -------------- Get the Containers and Pods --------------------
ipcMain.on(events.GET_CONTAINERS_AND_PODS, async (event, data) => {
  try {
    const apiNodeData = spawnSync('kubectl', ['get', 'pods', '-o=json'], { env: process.env });
    const stdout = apiNodeData.stdout.toString();
    const stdoutParsed = JSON.parse(stdout);

    const stderr = apiNodeData.stderr.toString();
    win.webContents.send('kubectl', { stdout, stderr });
    if (stderr) throw stderr;
    // return pod data to the render thread
    win.webContents.send(events.HANDLE_CONTAINERS_AND_PODS, stdoutParsed);
  } catch (err) {
    console.error('From GET_CONTAINERS_AND_PODS:', err);
    // return error message to the render thread to display
    win.webContents.send(events.HANDLE_CONTAINERS_AND_PODS, err);
  }
});

/** ----------- CREATE A POD --------------------------------
 * The following functions pass user input into a function a that creates a json object
 * based on a template. The new .json file is used to apply to kubectl in order to create
 * the appropriate kubernetes deployment
 * @param {Object} event
 * @param {Object} data - this is an object from the users form inputs
 * @return {String} - stdout from kubectl
*/
ipcMain.on(events.CREATE_POD, async (event, data) => {
  try {
    // CREATE AND WRITE A POD FILE FROM TEMPLATE
    const podYamlTemplate = kubernetesTemplates.createPodYamlTemplate(data);
    const stringifiedPodYamlTemplate = JSON.stringify(podYamlTemplate, null, 2);
    await fsp.writeFile(`${process.env.KUBECTL_STORAGE}pod_${data.podName}.json`, stringifiedPodYamlTemplate);
    // CREATE THE POD VIA kubectl
    const child = spawnSync('kubectl', ['apply', '-f', `${process.env.KUBECTL_STORAGE}pod_${data.podName}.json`], { env: process.env });
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();
    win.webContents.send('kubectl', { stdout, stderr });
    await awsHelperFunctions.timeout(1000 * 5);
    // SEND STDOUT TO RENDERER PROCESS
    if (stderr) {
      console.error('From CREATE_POD:', stderr);
      win.webContents.send(events.HANDLE_NEW_POD, stdout);
    } else {
      console.log('stdout from pod: ', stdout);
      win.webContents.send(events.HANDLE_NEW_POD, stdout);
      win.webContents.send(events.HANDLE_RERENDER_NODE, 'handle rerender node for create deployment');
    }
  } catch (err) {
    console.error('From CREATE_POD:', err);
  }
});

//* -------------- CREATE A SERVICE -------------------- *//
ipcMain.on(events.CREATE_SERVICE, async (event, data) => {
  try {
    console.log('CREATE_SERVICE data:', data);
    // CREATE AND WRITE THE SERVICE FILE FROM TEMPLATE
    const serviceYamlTemplate = kubernetesTemplates.createServiceYamlTemplate(data);
    const stringifiedServiceYamlTemplate = JSON.stringify(serviceYamlTemplate, null, 2);
    await fsp.writeFile(`${process.env.KUBECTL_STORAGE}service_${data.serviceName}.json`, stringifiedServiceYamlTemplate);
    // CREATE THE SERVICE VIA kubectl
    const child = spawnSync('kubectl', ['apply', '-f', `${process.env.KUBECTL_STORAGE}service_${data.serviceName}.json`], { env: process.env });
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();
    win.webContents.send('kubectl', { stdout, stderr });
    // SEND STATUS TO THE RENDERER PROCESS
    if (stderr) {
      console.error('From CREATE_SERVICE:', stderr);
      win.webContents.send(events.HANDLE_NEW_SERVICE, stdout);
    } else {
      console.log('stdout from deployment: ', stdout);
      win.webContents.send(events.HANDLE_NEW_SERVICE, stdout);
      win.webContents.send(events.HANDLE_RERENDER_NODE, 'handle rerender node for create service');
    }
  } catch (err) {
    console.error('From CREATE_SERVICE', err);
  }
});

//* -------------- CREATE A DEPLOYMENT ----------------- *//

ipcMain.on(events.CREATE_DEPLOYMENT, async (event, data) => {
  try {
    // START CREATING DEPLOYMENT
    if (data.replicas > 6) throw new Error(`Replica amount entered was ${data.replicas}. This value has to be 6 or less.`);
    // CREATE AND WRITE THE DEPLOYMENT FILE FROM TEMPLATE
    const deploymentYamlTemplate = kubernetesTemplates.createDeploymentYamlTemplate(data);
    const stringifiedDeploymentYamlTemplate = JSON.stringify(deploymentYamlTemplate, null, 2);
    await fsp.writeFile(`${process.env.KUBECTL_STORAGE}deployment_${data.deploymentName}.json`, stringifiedDeploymentYamlTemplate);
    // CREATE THE DEPOYMENT VIA kubectl
    const child = spawnSync('kubectl', ['create', '-f', `${process.env.KUBECTL_STORAGE}deployment_${data.deploymentName}.json`], { env: process.env });
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();
    win.webContents.send('kubectl', { stdout, stderr });
    await awsHelperFunctions.timeout(1000 * 10);
    // SEND STATUS TO THE RENDERER PROCESS
    if (stderr) {
      console.error('From CREATE_DEPLOYMENT:', stderr);
      win.webContents.send(events.HANDLE_NEW_DEPLOYMENT, stderr);
    } else {
      console.log('stdout from deployment: ', stdout);
      win.webContents.send(events.HANDLE_NEW_DEPLOYMENT, stdout);
      win.webContents.send(events.HANDLE_RERENDER_NODE, 'handle rerender node for create deployment');
    }
  } catch (err) {
    console.error('From CREATE_DEPLOYMENT', err);
  }
});

/** ----------------- DELETE A DEPLOYMENT -------------------------
 * @param {Object} event
 * @param {Object} data - object containing the information regarding the pod
 * the was clicked. This is used to determine the deployment to delete
 * @return {String} - stdout from kubectl
*/
ipcMain.on(events.DELETE_DEPLOYMENT, async (event, data) => {
  try {
    // DELETE THE POD VIA kubectl
    const deploymentName = data.data.name.split('-')[0];
    const child = spawnSync('kubectl', ['delete', 'deployment', deploymentName], { env: process.env });
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();
    win.webContents.send('kubectl', { stdout, stderr });
    if (stderr) throw new Error(stderr);
    // WAIT 10 SECONDS TO ALLOW DEPLOYMENT DELETION TO COMPLETE
    await awsHelperFunctions.timeout(1000 * 10);
    // SEND STDOUT TO RENDERER PROCESS
    win.webContents.send(events.HANDLE_RERENDER_NODE, 'delete');
  } catch (err) {
    console.error('From DELETE_DEPLOYMENT:', err);
  }
});

//* --------- APPLICATION OBJECT EVENT EMITTERS ---------- *//

function createMenu() {

  const application = {
    label: 'Application',
    submenu: [
      {
        label: 'About Application',
        selector: 'orderFrontStandardAboutPanel:',
      },
      {
        type: 'separator',
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click: () => {
          app.quit()
        }
      },
    ],
  };

  const edit = {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        selector: 'undo:',
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        selector: 'redo:',
      },
      {
        type: 'separator',
      },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        selector: 'cut:',
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        selector: 'copy:',
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        selector: 'paste:',
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:',
      },
    ],
  };

  const template = [application, edit];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// HANDLE app ready
app.on('ready', () => {
  if (NODE_ENV === 'development' || NODE_ENV === 'test') {
    createWindowAndSetEnvironmentVariables();
  } else {
    createWindowAndSetEnvironmentVariables();
    createMenu();
  }
});

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
