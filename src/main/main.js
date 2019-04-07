// --------- NPM MODULES ----------------
require('dotenv').config();

// --------- ELECTRON MODULES -----------
const { app, BrowserWindow, ipcMain } = require('electron');

// --------- NODE APIS -------------------
const fs = require('fs');
const fsp = require('fs').promises;
const { spawnSync } = require('child_process');
const path = require('path');

// --------- AWS SDK ELEMENTS ------------
// STS = AWS Security Token Service
const STS = require('aws-sdk/clients/sts');

// --------- INSTANTIATE AWS CLASSES -----
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

console.time('init');

// --------- CREATE WINDOW OBJECT --------------------------------------------

// Declare window objects
let win;

/** ------------ FUNCTION CALLED WHEN APP IS 'Ready' --------------------
 * Invoked with app.on('ready'):
 * Insures IAM Authenticator is installed and configured,
 * sets necessary environment variables
 * creates application window, serves either dev or production version of app and
 * @return {undefined}
*/
const createWindowAndSetEnvironmentVariables = () => {
  // TODO: add to application package
  awsEventCallbacks.installAndConfigureAWS_IAM_Authenticator();
  if (NODE_ENV === 'development') {
    process.env.APPLICATION_PATH = __dirname;
    awsEventCallbacks.setEnvVarsAndMkDirsInDev();
    BrowserWindow.addDevToolsExtension(REACT_DEV_TOOLS_PATH);
  } else if (NODE_ENV === 'test') {
    process.env.APPLICATION_PATH = __dirname;
    awsEventCallbacks.setEnvVarsAndMkDirsInDev();
  } else if (NODE_ENV === 'production') {
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
    maxWidth: 1200,
    backgroundColor: '#243B55',
    center: true,
    defaultFontFamily: 'sansSerif',
    title: 'MAIN',
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
    console.timeEnd('init');
  });
  win.on('closed', () => { win = null; });

  // load the child window and set the listeners
  childWin.loadURL(`file://${path.join(__dirname, '../client/childWindow/childIndex.html')}`);
  childWin.webContents.on('dom-ready', () => {
    // show the child window when ready to show
    childWin.show();
    // load the renderer url onto window after the child window is ready to show
    const urlPath = `file://${path.join(__dirname, '..', '..', 'dist/index.html')}`;
    console.log('\nNODE_ENV ========================> ', process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'development') {
      win.loadURL(`http://localhost:${PORT}`);
    } else if (process.env.NODE_ENV === 'production') {
      win.loadURL(urlPath);
    } else if (process.env.NODE_ENV === 'test') {
      win.loadURL(urlPath);
    }
  });

  childWin.on('closed', () => {
    childWin = null;
  });

  // Creates browser window that displays Kubernetes Docs when user clicks more info while creating a pod, service or deployment
  // For deployment
  // let kubeDocsDeploymentWindow = new BrowserWindow({
  //   width: 600,
  //   height: 400,
  //   show: false,
  // });

  //   kubeDocsDeploymentWindow.loadURL('https://kubernetes.io/docs/concepts/workloads/controllers/deployment/');
  //   ipcMain.on(events.SHOW_KUBE_DOCS_DEPLOYMENT, () => {
  //     kubeDocsDeploymentWindow.show();
  //   });

  //   kubeDocsDeploymentWindow.on('close', (e) => {
  //     e.preventDefault();
  //     kubeDocsDeploymentWindow.hide();
  //   });


  //   //For service
  // let kubeDocsServiceWindow = new BrowserWindow({
  //   width: 600,
  //   height: 400,
  //   show: false,
  // });

  // kubeDocsServiceWindow.loadURL('https://kubernetes.io/docs/concepts/services-networking/service/');
  // ipcMain.on(events.SHOW_KUBE_DOCS_SERVICE, () => {
  //   kubeDocsServiceWindow.show();
  // });

  //   kubeDocsServiceWindow.on('close', (e) => {
  //     e.preventDefault();
  //     kubeDocsServiceWindow.hide();
  //   });


  //   //For pod
  // let kubeDocsPodWindow = new BrowserWindow({
  //   width: 600,
  //   height: 400,
  //   show: false,
  // });

  // kubeDocsPodWindow.loadURL('https://kubernetes.io/docs/concepts/workloads/pods/pod-overview/');
  // ipcMain.on(events.SHOW_KUBE_DOCS_POD, () => {
  //   kubeDocsPodWindow.show();
  // });

//   kubeDocsPodWindow.on('close', (e) => {
//     e.preventDefault();
//     kubeDocsPodWindow.hide();
//   });
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
    win.webContents.send(events.RETURN_CREDENTIAL_STATUS, credentialStatusToReturn);
  } catch (err) {
    console.error('FROM CHECK_CREDENTIALS_STATUS:', err);
    win.webContents.send(events.RETURN_CREDENTIAL_STATUS, 'Credentials have not yet been set, or there is an error with the file');
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
    // Send status to front end to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, iamRoleStatus);

    vpcStackStatus.type = awsProps.VPC_STACK_STATUS;
    vpcStackStatus.status = awsProps.CREATING;
    win.webContents.send(events.HANDLE_STATUS_CHANGE, vpcStackStatus);
  } catch (err) {
    console.error('Error from CREATE_IAM_ROLE in index.js:', err);
    errorData.type = awsProps.IAM_ROLE_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating IAM Role: ${err}`;

    win.webContents.send(events.HANDLE_ERRORS, errorData);
  }

  // ---------------------- CREATE AWS STACK (approx 1 - 1.5 mins) -------------------
  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log('============  ipcMain.on(events.CREATE_TECH_STACK),... ==============');
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

    const { vpcStackName } = data;

    await awsEventCallbacks.createVPCStack(vpcStackName);

    vpcStackStatus.status = awsProps.CREATED;
    console.log('vpcStackStatus: ', vpcStackStatus);
    win.webContents.send(events.HANDLE_STATUS_CHANGE, vpcStackStatus);

    clusterStatus.type = awsProps.CLUSTER_STATUS;
    clusterStatus.status = awsProps.CREATING;
    win.webContents.send(events.HANDLE_STATUS_CHANGE, clusterStatus);
  } catch (err) {
    console.error('Error from CREATE_TECH_STACK: in index.js: ', err);
    errorData.type = awsProps.VPC_STACK_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating VPC Stack: ${err}`;
    win.webContents.send(events.HANDLE_ERRORS, errorData);
  }

  // ------------------------ CREATE AWS CLUSTER --------------------------------------
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
    console.error('Error from CLUSTER_STATUS: in index.js: ', err);
    errorData.type = awsProps.CLUSTER_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating Cluster: ${err}`;

    win.webContents.send(events.HANDLE_ERRORS, errorData);
  }

  // ----- CREATE KUBECONFIG FILE, CONFIGURE KUBECTL, CREATE WORKER NODE STACK ----------
  try {
    await kubectlConfigFunctions.createConfigFile(data.clusterName);
    await kubectlConfigFunctions.configureKubectl(data.clusterName);
    kubectlConfigFunctions.testKubectlGetSvc();
    await kubectlConfigFunctions.createStackForWorkerNode(data.clusterName);

    workerNodeStatus.status = awsProps.CREATED;
    win.webContents.send(events.HANDLE_STATUS_CHANGE, workerNodeStatus);

    kubectlConfigStatus.type = awsProps.KUBECTL_CONFIG_STATUS;
    kubectlConfigStatus.status = awsProps.CREATING;
    win.webContents.send(events.HANDLE_STATUS_CHANGE, kubectlConfigStatus);
  } catch (err) {
    console.error('Error from CREATE_TECH_STACK: in index.js: ', err);
    errorData.type = awsProps.WORKER_NODE_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating Worker Node Stack: ${err}`;
    win.webContents.send(events.HANDLE_ERRORS, errorData);
  }

  // --------- CREATE NODE INSTANCE AND TEST KUBECTL CONFIG STATUS -------------
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

    win.webContents.send(events.SEND_CLUSTER_DATA, parsedAWSMasterFileData);
  } catch (err) {
    console.error('From GET_CLUSTER_DATA', err);
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

// -------------- Get Worker Nodes --------------------
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

// -------------- Get the Containers and Pods --------------------
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

// -----------------------SERVICE--------------------------------
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
    if (stderr) throw new Error(stderr);
    // SEND STDOUT TO RENDERER PROCESS
    win.webContents.send(events.HANDLE_NEW_SERVICE, stdout);
  } catch (err) {
    console.error('From CREATE_SERVICE', err);
  }
});

//* -------------- CREATE A DEPLOYMENT----------------- *//

ipcMain.on(events.CREATE_DEPLOYMENT, async (event, data) => {

  let loadingChildWindow;
  try {
    // Create Loading Icon Child Window
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
    loadingChildWindow.loadURL(`file://${path.join(__dirname, '../childWindow/childIndex.html')}`);

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
    loadingChildWindow.close();
    loadingChildWindow = null;
  } catch (err) {
    loadingChildWindow.close();
    loadingChildWindow = null;
    console.error('From CREATE_DEPLOYMENT', err);
  }
});

/** ----------------- DELETE A DEPLOYMENT -------------------------
 * @param {Object} event
 * @param {Object} data - object containing the information regarding the pod
 * the was clicked. This is used to determine the deployment to delete
 * @return {String} - stdout from kubectl
*/
// TODO: rename to delete deployment
ipcMain.on(events.DELETE_NODE, async (event, data) => {
  try {
    // DELETE THE POD VIA kubectl
    const deploymentName = data.data.name.split('-')[0];
    const child = spawnSync('kubectl', ['delete', 'deployment', deploymentName]);
    const stdout = child.stdout.toString();

    const stderr = child.stderr.toString();
    if (stderr) throw new Error(stderr);
    // SEND STDOUT TO RENDERER PROCESS
    await awsHelperFunctions.timeout(1000 * 10);
    win.webContents.send(events.HANDLE_RERENDER_NODE, stdout);
  } catch (err) {
    console.error('From DELETE_NODE:', err);
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
