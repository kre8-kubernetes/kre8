require('dotenv').config();

const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  Menu,
} = require('electron');

process.env.APP_PATH = app.getAppPath();

const fs = require('fs');
const fsp = require('fs').promises;
const { spawnSync } = require('child_process');
const path = require('path');

const STS = require('aws-sdk/clients/sts');

const sts = new STS({ signatureCache: false });

const events = require('../eventTypes.js');

const { logWithLabel, logStep, logLabeledError } = require('./utils');

const { clusterInitError } = require('./utils/errors');

const {
  AWS_CREDENTIALS_STATUS,
  AWS_CREDENTIALS_STATUS_CONFIGURED,
  CREATED,
  CREATING,
  IAM_ROLE_STATUS,
  VPC_STACK_STATUS,
  CLUSTER_STATUS,
  WORKER_NODE_STATUS,
  KUBECTL_CONFIG_STATUS,
  CLUSTER_NAME,
} = require(__dirname + '/awsPropertyNames');

const {
  installAndConfigureAWS_IAM_Authenticator,
  setEnvVarsAndMkDirsInDev,
  setEnvVarsAndMkDirsInProd,
  returnKubectlAndCredentialsStatus,
  configureAWSCredentials,
  createIAMRole,
  createVPCStack,
  createCluster,
} = require(__dirname + '/helperFunctions/awsEventCallbacks');

const {
  createConfigFile,
  configureKubectl,
  createStackForWorkerNode,
  inputNodeInstance,
  testKubectlStatus,
} = require(__dirname + '/helperFunctions/kubectlConfigFunctions');

const {
  createPodYamlTemplate,
  createServiceYamlTemplate,
  createDeploymentYamlTemplate,
} = require(__dirname + '/helperFunctions/kubernetesTemplates');
const {
  timeout,
  updateCredentialsFile,
} = require(__dirname + '/helperFunctions/awsHelperFunctions');

const { PORT, NODE_ENV } = process.env;

let win;

/** ------------ FUNCTION CALLED WHEN APP IS 'Ready' --------------------
 * Invoked with app.on('ready'):
 * Insures IAM Authenticator is installed and configured,
 * sets necessary environment variables
 * creates application window, serves either dev or production version of app and
 * @return {undefined}
*/
const createWindowAndSetEnvironmentVariables = () => {
  installAndConfigureAWS_IAM_Authenticator();
  if (NODE_ENV === 'development') {
    process.env.APPLICATION_PATH = __dirname;
    setEnvVarsAndMkDirsInDev();
  } else if (NODE_ENV === 'test') {
    process.env.APPLICATION_PATH = __dirname;
    setEnvVarsAndMkDirsInDev();
  } else {
    setEnvVarsAndMkDirsInProd();
  }

  /*
  * If awsCredentials file has already been created, use data to set additional required
  * AWS Environment Variables AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, REGION
  */
  if (fs.existsSync(`${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`)) {
    const readCredentialsFile = fs.readFileSync(
      `${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`,
      'utf-8',
    );
    const parsedCredentialsFile = JSON.parse(readCredentialsFile);

    // TODO (braden): this needs to be re-thought, no idea what this is doing.
    Object.entries(parsedCredentialsFile).forEach((arr, index) => {
      if (index < 4) {
        process.env[arr[0]] = arr[1];
      }
      if (index === 4) {
        process.env.KUBECONFIG = `${process.env.HOME}/.kube/config-${arr[1]}`;
      }
    });
  }

  // This is the main application window
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
    webPreferences: {
      nodeIntegration: true,
    }
  });

  // an event listener for when a navigation occurs on the client
  // side. Like clicking a link. Mostly used for ensuring we open
  // urls to in broswers for specific sites.
  win.webContents.on('will-navigate', (event, url) => {
    event.preventDefault();
    if (url.includes('amazon') || url.includes('kubernetes')) {
      shell.openExternal(url);
    }
  });

  // This window in the loading icon window
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
    webPreferences: {
      nodeIntegration: true,
    }
  });

  // when our main application is read, this event will trigger
  // so its a good place to close our loading window and explicitly
  // show the main application.
  win.once('ready-to-show', () => {
    win.show();
    childWin.close();
  });

  win.on('closed', () => { win = null; });

  // load the child window and set the listeners
  childWin.loadURL(`file://${path.join(__dirname, '../client/childWindow/childIndex.html')}`);

  childWin.webContents.on('dom-ready', () => {
    childWin.show();

    logWithLabel('NODE_ENV', NODE_ENV);
    logWithLabel('APPLICATION_PATH', process.env.APPLICATION_PATH);
    logWithLabel('STORAGE', process.env.AWS_STORAGE);
    logWithLabel('APP_PATH', process.env.APP_PATH);

    // load the renderer url onto window after the child window is ready to show
    const urlPath = `file://${path.join(__dirname, '..', '..', 'dist/index.html')}`;

    if (NODE_ENV === 'development') {
      win.loadURL(`http://localhost:${PORT}`);
    } else {
      win.loadURL(urlPath);
    }
  });

  childWin.on('closed', () => {
    childWin = null;
  });
};

/**
 * Check credentials file to determine if user needs to configure the
 * application. This will execute on every opening of the application
 */
ipcMain.on(events.CHECK_CREDENTIAL_STATUS, async () => {
  try {
    const hasAwsCredentials = await returnKubectlAndCredentialsStatus();
    win.webContents.send(events.RETURN_CREDENTIAL_STATUS, hasAwsCredentials);
  } catch (err) {
    logLabeledError(events.CHECK_CREDENTIAL_STATUS, err);
    win.webContents.send(
      events.RETURN_CREDENTIAL_STATUS,
      'Credentials have not yet been set, or there is an error with the file',
    );
  }
});

/**
 * Function fires when user submits AWS credential information on homepage
 * Writes credentials to file, sets environment variables with data from user,
 * verifies with AWS API that credentials were correct, if so user is advanced to
 * next setup page; otherwise, user is asked to retry entering credentials
*/
ipcMain.on(events.SET_AWS_CREDENTIALS, async (event, data) => {
  logStep('SET_AWS_CREDENTIALS Function');
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
    await configureAWSCredentials(data);

    /**
     * Sets the credentials to null in sts object, because AWS caches the access key from a
     * correct login and will not check if the secrect access key changed in relation to the
     * access key. This could lead to an issue if the user put in their secret access key in
     * wrong the first time or would like to change their credentials.
     */
    sts.config.credentials = null;
    const credentialStatus = await sts.getCallerIdentity().promise();

    if (credentialStatus.Arn) {
      loadingChildWindow.close();
      await updateCredentialsFile(
        AWS_CREDENTIALS_STATUS,
        AWS_CREDENTIALS_STATUS_CONFIGURED,
      );
      win.webContents.send(events.HANDLE_AWS_CREDENTIALS, credentialStatus);
    }
  } catch (err) {
    logLabeledError(events.SET_AWS_CREDENTIALS, err);
    loadingChildWindow.close();
    loadingChildWindow = null;
    win.webContents.send(
      events.HANDLE_AWS_CREDENTIALS,
      'Login details were incorrect. Please check your credentials and try again.',
    );
  }
});

// TODO (braden): since these have their own category of tasks, can we split these
// up into their own module?
/**
 * createCluster() executes on the first interaction with the app when user submits data from
 * the AWS container from the renderer thread. The whole process will take approximately 10-15 minutes
 * This will create an IAM Role, a VPC stack, an EKS Cluster, and a Stack for EC2 worker nodes.
 * @param {Object} event
 * @param {Object} data - this is an object container role name, VPC name and cluster name
 * @return {Object} - this will continuously emit status object back to communicate with the renderer
 * thread, where in the process this function is at. Done to better inform user.
 */
ipcMain.on(events.CREATE_CLUSTER, async (event, data) => {
  try {
    // Set CLUSTER_NAME environment variable based on user input and save to credentials file
    process.env.CLUSTER_NAME = data.clusterName;

    await updateCredentialsFile(CLUSTER_NAME, data.clusterName);

    // CREATE AWS IAM ROLE + ATTACH POLICY DOCS
    logStep('ipcMain.on(events.CREATE_IAM_ROLE)');

    // Send data to AWS to create IAM Role, timing: 10 - 30 seconds
    await createIAMRole(data.iamRoleName);

    // Send IAM Role status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, {
      type: IAM_ROLE_STATUS,
      status: CREATED,
    });

    // Send VPC Stack status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, {
      type: VPC_STACK_STATUS,
      status: CREATING,
    });
  } catch (err) {
    logLabeledError(events.CREATE_CLUSTER, err);
    // Send error status to render thread to display
    win.webContents.send(
      events.HANDLE_ERRORS,
      clusterInitError(IAM_ROLE_STATUS, 'IAM Role', err),
    );
  }

  // CREATE AWS STACK (approx 1 - 1.5 mins)
  try {
    logStep('ipcMain.on(events.CREATE_TECH_STACK)');

    const { vpcStackName } = data;

    // Send data to AWS to create VPC Stack, timing: 30 seconds - 1 minute
    await createVPCStack(vpcStackName);

    logWithLabel(VPC_STACK_STATUS, CREATED);
    // Send VPC Stack status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, { status: CREATED });

    // Send Cluster status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, {
      type: CLUSTER_STATUS,
      status: CREATING,
    });
  } catch (err) {
    logLabeledError(VPC_STACK_STATUS, err);

    win.webContents.send(
      events.HANDLE_ERRORS,
      clusterInitError(VPC_STACK_STATUS, 'VPC Stack', err),
    );
  }

  // CREATE AWS CLUSTER
  try {
    logStep('ipcMain.on(events.CREATE_CLUSTER)');

    await createCluster(data.clusterName);

    // Send Cluster status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, { status: CREATED });

    // Send Worker Node status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, {
      type: WORKER_NODE_STATUS,
      status: CREATING,
    });
  } catch (err) {
    logWithLabel(CLUSTER_STATUS, err);

    win.webContents.send(
      events.HANDLE_ERRORS,
      clusterInitError(CLUSTER_STATUS, 'Cluster', err),
    );
  }

  // CREATE KUBECONFIG FILE, CONFIGURE KUBECTL, CREATE WORKER NODE STACK
  try {
    await createConfigFile(data.clusterName);
    await configureKubectl(data.clusterName);
    // testKubectlGetSvc();
    await createStackForWorkerNode(data.clusterName);

    // Send Worker Node status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, { status: CREATED });

    // Send kubectl status to render thread to display
    win.webContents.send(events.HANDLE_STATUS_CHANGE, {
      type: KUBECTL_CONFIG_STATUS,
      status: CREATING,
    });
  } catch (err) {
    logLabeledError(WORKER_NODE_STATUS, err);

    win.webContents.send(
      events.HANDLE_ERRORS,
      clusterInitError(WORKER_NODE_STATUS, 'Worker Node Stack', err),
    );
  }

  // CREATE NODE INSTANCE AND TEST KUBECTL CONFIG STATUS
  try {
    await inputNodeInstance(data.clusterName);
    const kubectlConfigStatusTest = await testKubectlStatus();

    if (kubectlConfigStatusTest === true) {
      await timeout(1000 * 15);

      // Send kubectl status to render thread to display
      win.webContents.send(events.HANDLE_STATUS_CHANGE, { status: CREATED });
      // Send instructions to render thread to generate graph
      win.webContents.send(events.HANDLE_NEW_NODES, kubectlConfigStatusTest);
    } else {
      // Send error message to render thread to display
      win.webContents.send(events.HANDLE_ERRORS, 'An error ocurred while configuring kubectl');
    }
  } catch (err) {
    logLabeledError('configuring Kubectl', err);

    win.webContents.send(
      events.HANDLE_ERRORS,
      clusterInitError(KUBECTL_CONFIG_STATUS, 'kubectl', err),
    );
  }
});


// TODO (braden): again, should we move this into it's own module since it
// has a specific function separate to above ^^?
/**
 * Check credentials file to determine if user needs to configure the application
 * If credential's file hasn't been created yet (meaning user hasn't entered credentials
 * previously), serve HomeComponent page, otherwise serve HomeComponentPostCredentials.
 * This will excute when the application is opened
 * @param {Object} event
 * @return {Object} - object containing information from masterFile
*/
ipcMain.on(events.GET_CLUSTER_DATA, async () => {
  try {
    const dataFromCredentialsFile = await fsp.readFile(
      `${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`,
      'utf-8',
    );

    const parsedCredentialsFileData = JSON.parse(dataFromCredentialsFile);
    const { clusterName } = parsedCredentialsFileData;

    const dataFromMasterFile = await fsp.readFile(
      `${process.env.AWS_STORAGE}AWS_Private/${clusterName}_MASTER_FILE.json`,
      'utf-8',
    );
    const parsedAWSMasterFileData = JSON.parse(dataFromMasterFile);
    delete parsedAWSMasterFileData.certificateAuthorityData;
    // Send cluster data to render thread to generate graph
    win.webContents.send(events.SEND_CLUSTER_DATA, parsedAWSMasterFileData);
  } catch (err) {
    logLabeledError('GET_CLUSTER_DATA', err);
  }
});


// TODO (braden): all kubectl event listeners, lets split into own file...
/**
 * The following run 'kubectl get [component] -o=json' to get the services, one element in the
 * item array will contain the apiserver. result.items[x].metadata.labels.component = 'apiserver'
 * @param {Object} event
 * @param {String} data
 * @return {Object} - apiserver information from kubernetes api
*/
ipcMain.on(events.GET_MASTER_NODE, async () => {
  try {
    // command kubctl to get service data
    const apiServiceData = spawnSync('kubectl', ['get', 'svc', '-o=json'], { env: process.env });
    // string the data and log to the console;
    const stdout = apiServiceData.stdout.toString();
    const stdoutParsed = JSON.parse(stdout);
    const stderr = apiServiceData.stderr.toString();

    if (stderr) throw stderr;
    const clusterApiData = stdoutParsed.items.find((item) => {
      if (item.metadata.labels) {
        return item.metadata.labels.component === 'apiserver';
      }
    });
    // return service data to the render thread
    win.webContents.send(events.HANDLE_MASTER_NODE, clusterApiData);
  } catch (err) {
    logLabeledError(events.GET_MASTER_NODE, err);
    win.webContents.send(events.HANDLE_MASTER_NODE, err);
  }
});

ipcMain.on(events.GET_WORKER_NODES, async () => {
  try {
    const apiNodeData = spawnSync('kubectl', ['get', 'nodes', '-o=json'], { env: process.env });
    const stdout = apiNodeData.stdout.toString();
    const stdoutParsed = JSON.parse(stdout);
    const stderr = apiNodeData.stderr.toString();

    if (stderr) throw stderr;
    // return worker node data to the render thread
    win.webContents.send(events.HANDLE_WORKER_NODES, stdoutParsed);
  } catch (err) {
    logLabeledError(events.GET_WORKER_NODES, err);
    // send error message to the render thread to display
    win.webContents.send(events.HANDLE_WORKER_NODES, err);
  }
});

ipcMain.on(events.GET_CONTAINERS_AND_PODS, async () => {
  try {
    const apiNodeData = spawnSync('kubectl', ['get', 'pods', '-o=json'], { env: process.env });
    const stdout = apiNodeData.stdout.toString();
    const stdoutParsed = JSON.parse(stdout);

    const stderr = apiNodeData.stderr.toString();
    if (stderr) throw stderr;
    // return pod data to the render thread
    win.webContents.send(events.HANDLE_CONTAINERS_AND_PODS, stdoutParsed);
  } catch (err) {
    logLabeledError(events.GET_CONTAINERS_AND_PODS, err);
    // return error message to the render thread to display
    win.webContents.send(events.HANDLE_CONTAINERS_AND_PODS, err);
  }
});

/**
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
    const podYamlTemplate = createPodYamlTemplate(data);
    const stringifiedPodYamlTemplate = JSON.stringify(podYamlTemplate, null, 2);
    await fsp.writeFile(
      `${process.env.KUBECTL_STORAGE}pod_${data.podName}.json`,
      stringifiedPodYamlTemplate,
    );
    // CREATE THE POD VIA kubectl
    const child = spawnSync(
      'kubectl',
      ['apply', '-f', `${process.env.KUBECTL_STORAGE}pod_${data.podName}.json`],
      { env: process.env },
    );
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();

    await timeout(1000 * 5);
    // SEND STDOUT TO RENDERER PROCESS
    if (stderr) {
      logLabeledError(events.CREATE_POD, stderr);
      win.webContents.send(events.HANDLE_NEW_POD, stdout);
    } else {
      logWithLabel('stdout from pod', stdout);
      win.webContents.send(events.HANDLE_NEW_POD, stdout);
      win.webContents.send(events.HANDLE_RERENDER_NODE, 'handle rerender node for create deployment');
    }
  } catch (err) {
    logLabeledError(events.CREATE_POD, err);
  }
});

ipcMain.on(events.CREATE_SERVICE, async (event, data) => {
  try {
    logWithLabel(events.CREATE_SERVICE, data);
    // CREATE AND WRITE THE SERVICE FILE FROM TEMPLATE
    const serviceYamlTemplate = createServiceYamlTemplate(data);
    const stringifiedServiceYamlTemplate = JSON.stringify(serviceYamlTemplate, null, 2);
    await fsp.writeFile(
      `${process.env.KUBECTL_STORAGE}service_${data.serviceName}.json`,
      stringifiedServiceYamlTemplate,
    );
    // CREATE THE SERVICE VIA kubectl
    const child = spawnSync(
      'kubectl',
      ['apply', '-f', `${process.env.KUBECTL_STORAGE}service_${data.serviceName}.json`],
      { env: process.env },
    );
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();
    // SEND STATUS TO THE RENDERER PROCESS
    if (stderr) {
      logLabeledError(events.CREATE_SERVICE, stderr);
      win.webContents.send(events.HANDLE_NEW_SERVICE, stdout);
    } else {
      logWithLabel('stdout from deployment: ', stdout);
      win.webContents.send(events.HANDLE_NEW_SERVICE, stdout);
      win.webContents.send(events.HANDLE_RERENDER_NODE, 'handle rerender node for create service');
    }
  } catch (err) {
    logLabeledError(events.CREATE_SERVICE, err);
  }
});

ipcMain.on(events.CREATE_DEPLOYMENT, async (event, data) => {
  try {
    // START CREATING DEPLOYMENT
    if (data.replicas > 6) {
      throw new Error(`Replica amount entered was ${data.replicas}. This value has to be 6 or less.`);
    }
    // CREATE AND WRITE THE DEPLOYMENT FILE FROM TEMPLATE
    const deploymentYamlTemplate = createDeploymentYamlTemplate(data);
    const stringifiedDeploymentYamlTemplate = JSON.stringify(deploymentYamlTemplate, null, 2);
    await fsp.writeFile(
      `${process.env.KUBECTL_STORAGE}deployment_${data.deploymentName}.json`,
      stringifiedDeploymentYamlTemplate,
    );
    // CREATE THE DEPOYMENT VIA kubectl
    const child = spawnSync(
      'kubectl',
      ['create', '-f', `${process.env.KUBECTL_STORAGE}deployment_${data.deploymentName}.json`],
      { env: process.env },
    );
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();

    await timeout(1000 * 30);
    // SEND STATUS TO THE RENDERER PROCESS
    if (stderr) {
      logLabeledError(events.CREATE_DEPLOYMENT, stderr);
      win.webContents.send(events.HANDLE_NEW_DEPLOYMENT, stderr);
    } else {
      logWithLabel('stdout from deployment: ', stdout);
      win.webContents.send(events.HANDLE_NEW_DEPLOYMENT, stdout);
      win.webContents.send(events.HANDLE_RERENDER_NODE, 'handle rerender node for create deployment');
    }
  } catch (err) {
    logLabeledError(events.CREATE_DEPLOYMENT, err);
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
    const split = data.data.name.split('-');
    const deploymentName = split.slice(0, split.length - 2).join('-');
    const child = spawnSync(
      'kubectl',
      ['delete', 'deployment', deploymentName],
      { env: process.env },
    );
    const stderr = child.stderr.toString();

    if (stderr) throw new Error(stderr);
    // WAIT 10 SECONDS TO ALLOW DEPLOYMENT DELETION TO COMPLETE
    await timeout(1000 * 10);
    // SEND STDOUT TO RENDERER PROCESS
    win.webContents.send(events.HANDLE_RERENDER_NODE, 'delete');
  } catch (err) {
    logLabeledError(events.DELETE_DEPLOYMENT, err);
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
          app.quit();
        },
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
