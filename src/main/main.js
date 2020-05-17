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
const path = require('path');

const STS = require('aws-sdk/clients/sts');

const sts = new STS({ signatureCache: false });

const events = require('../eventTypes.js');

const { logWithLabel, logStep, logLabeledError } = require('./utils');

const {
  getClusterDataHandler,
  getMasterNodeHandler,
  getWorkerNodesHandler,
  getContainersAndPodsHandler,
  createPodHandler,
  createServiceHandler,
  createDeploymentHandler,
  deleteDeploymentHandler,
} = require('./eventHandlers/clusterActions');

const { createClusterHandler } = require('./eventHandlers/clusterSetup');

const { checkCrendentialsStatusHandler } = require('./eventHandlers/authentication');

const {
  AWS_CREDENTIALS_STATUS,
  AWS_CREDENTIALS_STATUS_CONFIGURED,
} = require(__dirname + '/awsPropertyNames');

const {
  installAndConfigureAWS_IAM_Authenticator,
  setEnvVarsAndMkDirsInDev,
  setEnvVarsAndMkDirsInProd,
  configureAWSCredentials,
} = require(__dirname + '/helperFunctions/awsEventCallbacks');

const {
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

// EVENT LISTENERS
ipcMain.on(events.CHECK_CREDENTIAL_STATUS, checkCrendentialsStatusHandler);
// TODO (braden): not sure how to move this one to a handlerFunction outside
// of the main.js file. Need to read up on electron.
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

// The main event listener for creating a cluster
ipcMain.on(events.CREATE_CLUSTER, createClusterHandler);

// Event listener the gets called on application startup
// to find cluster data if available.
ipcMain.on(events.GET_CLUSTER_DATA, getClusterDataHandler);

// Kubectl event listeners
ipcMain.on(events.GET_MASTER_NODE, getMasterNodeHandler);
ipcMain.on(events.GET_WORKER_NODES, getWorkerNodesHandler);
ipcMain.on(events.GET_CONTAINERS_AND_PODS, getContainersAndPodsHandler);
ipcMain.on(events.CREATE_POD, createPodHandler);
ipcMain.on(events.CREATE_SERVICE, createServiceHandler);
ipcMain.on(events.CREATE_DEPLOYMENT, createDeploymentHandler);
ipcMain.on(events.DELETE_DEPLOYMENT, deleteDeploymentHandler);

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
