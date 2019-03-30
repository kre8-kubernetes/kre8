//** --------- NPM MODULES ---------------- 
require('dotenv').config();
const { electron, app, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');

//** --------- NODE APIS ---------------- 
const fs = require('fs');
const fsp = require('fs').promises;
const { spawn, spawnSync } = require('child_process');
const path = require('path');
//const mkdirp = require('mkdirp');
//const fsp = require('fs').promises;

//** --------- AWS SDK ELEMENTS --------- 
const IAM = require('aws-sdk/clients/iam');
const STS = require('aws-sdk/clients/sts');
//const EKS = require('aws-sdk/clients/eks');
//const CloudFormation = require('aws-sdk/clients/cloudformation');

//** --------- INSTANTIATE AWS CLASSES --- 
const sts = new STS();
//const eks = new EKS();
//const cloudformation = new CloudFormation();
//const awsConfig = new AWSConfig();
//const iam = new IAM();
//const eks = new EKS({ region: REGION });
//const cloudformation = new CloudFormation({ region: REGION });

//** --------- IMPORT MODULES -----------
const events = require('../eventTypes.js')
const awsEventCallbacks = require(__dirname + '/helperFunctions/awsEventCallbacks'); 
const kubectlConfigFunctions = require(__dirname + '/helperFunctions/kubectlConfigFunctions');
const kubernetesTemplates = require(__dirname + '/helperFunctions/kubernetesTemplates');
const awsHelperFunctions = require(__dirname + '/helperFunctions/awsHelperFunctions'); 
const awsProps = require(__dirname + '/awsPropertyNames'); 

//const awsParameters = require(__dirname + '/helperFunctions/awsParameters');

//** --------- IMPORT DOCUMENT TEMPLATES - 
// const iamRolePolicyDocument = require(__dirname + '/sdkAssets/samples/iamRoleTrustPolicy.json');
// const stackTemplate = require(__dirname + '/sdkAssets/samples/amazon-stack-template-eks-vpc-real.json');

//** --------- .ENV Variables -------------- 
//let REGION = process.env.REGION;
const PORT = process.env.PORT;
const REACT_DEV_TOOLS_PATH = process.env.REACT_DEV_TOOLS_PATH;

//Declare window object
let win;
let childWin;

console.time('init')

//** --------- CREATE WINDOW OBJECT -------------------------------------------- **//
//Invoked with app.on('ready'): 
//Insures IAM Authenticator is installed and configured 
//sets necessary environment variables
//creates application window, serves either dev or production version of app and
function createWindowAndSetEnvironmentVariables () {

  awsEventCallbacks.installAndConfigureAWS_IAM_Authenticator();
  
  if (isDev) {
    BrowserWindow.addDevToolsExtension(REACT_DEV_TOOLS_PATH);
    process.env['APPLICATION_PATH'] = __dirname;

    awsEventCallbacks.setEnvVarsAndMkDirsInDev();

  } else {
    awsEventCallbacks.setEnvVarsAndMkDirsInProd();
    //TODO: Braden check if we need to create directories, or if we can do in the configuration of electron we do it then
  }

  //If awsCredentials file has already been created, use data to set additional required 
  //AWS Environment Variables AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, REGION
  if (fs.existsSync(process.env['AWS_STORAGE'] + 'AWS_Private/awsCredentials.json')) {
    const readCredentialsFile = fs.readFileSync(process.env['AWS_STORAGE'] + 'AWS_Private/awsCredentials.json', 'utf-8');
    const parsedCredentialsFile = JSON.parse(readCredentialsFile);

    console.log("process.env['KUBECONFIG']: ", process.env['KUBECONFIG']);

    Object.entries(parsedCredentialsFile).forEach((arr, index) => {
      if (index < 4) {
        process.env[arr[0]] = arr[1];
        console.log("process.env[arr[0]]: ", [arr[0]], process.env[arr[0]]);
      }
      if (index === 4) {

        console.log("arr[0]:", arr[0]);
        console.log("arr[1]", arr[1]);

        process.env['KUBECONFIG'] = process.env['HOME'] + `/.kube/config-${arr[1]}`;
      }
    });

    console.log("process.env['KUBECONFIG'] after: ", process.env['KUBECONFIG']);
  }


  win = new BrowserWindow({ show: false, height: 720, width: 930, minHeight: 550, minWidth: 700,  backgroundColor: '#243B55', center: true });

  win.loadURL(isDev ? `http://localhost:${PORT}` : `file://${path.join(__dirname, 'dist/index.html')}`)
  
  win.once('ready-to-show', () => {
    win.show();
    childWin.close();
    console.timeEnd('init');
  })

  win.on('closed', () => win = null)

  childWin = new BrowserWindow({ height: 325, width: 325, maxHeight: 325, maxWidth: 325, minHeight: 325, minWidth: 325, parent: win, show: true, frame: false, backgroundColor: '#141E30', center: true  });

  // childWin.loadURL(isDev ? `http://localhost:${PORT}` : `file://${path.join(__dirname, 'dist/index_child.html')}`);

  childWin.loadURL(`file://${path.join(__dirname, '../src/childWindow/childIndex.html')}`);


  // childWin.loadURL(`file://${path.join(__dirname, 'dist/index_child.html')}`);

  childWin.once('ready-to-show', () => {
    childWin.show()
  })

  childWin.on('closed', () => {
    childWin = null;
  })


//Kube Docs Window
let kubeDocsDeploymentWindow = new BrowserWindow({ width: 600, height: 400, show:false});
kubeDocsDeploymentWindow.loadURL('https://kubernetes.io/docs/concepts/workloads/controllers/deployment/')
ipcMain.on(events.SHOW_KUBE_DOCS_DEPLOYMENT, function(){
  kubeDocsDeploymentWindow.show()
})
kubeDocsDeploymentWindow.on('close', () =>{
  kubeDocsDeploymentWindow.hide();
})
}












//** ------- EXECUTES ON EVERY OPENING OF APPLICATION -------------------------- **//
//** ------- Check credentials file to determine if user needs to configure the application **// 

//If kubectl has not yet been configured and/or the credential's file hasn't been created yet (meaning user hasn't entered credentials previously), 
//serve HomeComponent page, else, serve HomeComponentPostCredentials
ipcMain.on(events.CHECK_CREDENTIAL_STATUS, async (event, data) => {

  try {
    const credentialStatusToReturn = await awsEventCallbacks.returnKubectlAndCredentialsStatus(data);
    
    console.log("Kubectl + Credential Status: ", credentialStatusToReturn)
    win.webContents.send(events.RETURN_CREDENTIAL_STATUS, credentialStatusToReturn);

  } catch (err) {
    console.log(err)
    win.webContents.send(events.RETURN_CREDENTIAL_STATUS, "Credentials have not yet been set, or there is an error with the file");
  }
})

//** --------- EXECUTES ON USER'S FIRST INTERACTION WITH APP ---------------- **//
//** --------- Verifies and Configures User's AWS Credentials --------------- **//
//Function fires when user submits AWS credential information on homepage
//Writes credentials to file, sets environment variables with data from user,
//verifies with AWS API that credentials were correct, if so user is advanced to
//next setup page; otherwise, user is asked to retry entering credentials
ipcMain.on(events.SET_AWS_CREDENTIALS, async (event, data) => {

  console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
  console.log('=============  SET_AWS_CREDENTIALS Fucntion fired ================')
  console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

  console.log('SET_AWS_CREDENTIALS FUNCTION FIRED data', data);

  try {

    awsEventCallbacks.configureAWSCredentials(data);

    let credentialStatus = await sts.getCallerIdentity().promise();
    console.log("credentialStatus: ", credentialStatus);

    if (credentialStatus.Arn) {
      console.log("credentialStatus.Arn in yes: ", credentialStatus.Arn);

      await awsHelperFunctions.updateCredentialsFile(awsProps.AWS_CREDENTIALS_STATUS, awsProps.AWS_CREDENTIALS_STATUS_CONFIGURED);
      win.webContents.send(events.HANDLE_AWS_CREDENTIALS, credentialStatus);

    } else {
      console.log("credentialStatus.Arn in else: ", credentialStatus.Arn)

      credentialStatus = false;
      win.webContents.send(events.HANDLE_AWS_CREDENTIALS, credentialStatus);
    }

  } catch (err) {
    console.log(err);
  }
})

//** --------- AWS SDK EVENTS-------------------------------------------------------------------------------- **//
//** --------- EXECUTES ON FIRST INTERACTION WITH APP WHEN USER SUBMITS DATA FROM PAGE 2, AWS CONTAINER ----- **//
//** --------- Takes 10 - 15 minutes to complete ------------------------------------------------------------ **//
//** --------- Creates AWS account components: IAM Role, Stack, Cluster, Worker Node Stack ------------------ **//


ipcMain.on(events.CREATE_CLUSTER, async (event, data) => {

  const iamRoleStatus = {};
  const vpcStackStatus = {};
  const clusterStatus = {};
  const workerNodeStatus = {};
  const kubectlConfigStatus = {};
  const errorData = {};

  try {

     //Set CLUSTER_NAME environment variable based on user input and save to credentials file
     process.env['CLUSTER_NAME'] = data.clusterName;

     await awsHelperFunctions.updateCredentialsFile(awsProps.CLUSTER_NAME, data.clusterName);


    //** --------- CREATE AWS IAM ROLE + ATTACH POLICY DOCS ---------------------------
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('============  ipcMain.on(events.CREATE_IAM_ROLE)... =================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    
   

    //Send data to AWS to create IAM Role, timing: 10 - 30 seconds
    const iamRoleStatusData = await awsEventCallbacks.createIAMRole(data.iamRoleName);
    console.log("iamRoleCreated data to send: ", iamRoleStatusData);

    iamRoleStatus.type = awsProps.IAM_ROLE_STATUS;
    iamRoleStatus.status = awsProps.CREATED;

    //Send status to front end to display
    console.log("sending Iam role data:", iamRoleStatus);
    win.webContents.send(events.HANDLE_STATUS_CHANGE, iamRoleStatus);

    vpcStackStatus.type = awsProps.VPC_STACK_STATUS;
    vpcStackStatus.status = awsProps.CREATING;

    console.log("sending VPC Stack data:", vpcStackStatus);
    win.webContents.send(events.HANDLE_STATUS_CHANGE, vpcStackStatus);


  } catch (err) {
    console.log('Error from CREATE_IAM_ROLE in main.js:', err);

    errorData.type = awsProps.IAM_ROLE_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating IAM Role: ${err}`

    console.log("errorMessage: ", errorData);

    win.webContents.send(events.HANDLE_ERRORS, errorData);
  }

  // //** ------ CREATE AWS STACK + SAVE RETURNED DATA IN FILE ---- **//
  //Takes approx 1 - 1.5 mins to create stack and get data back from AWS

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('============  ipcMain.on(events.CREATE_TECH_STACK),... ==============')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
   
    const vpcStackName = data.vpcStackName;

    const createdStack = await awsEventCallbacks.createVPCStack(vpcStackName, data.iamRoleName);

    vpcStackStatus.status = awsProps.CREATED;
    console.log("vpcStackStatus: ", vpcStackStatus);
    win.webContents.send(events.HANDLE_STATUS_CHANGE, vpcStackStatus);


    clusterStatus.type = awsProps.CLUSTER_STATUS;
    clusterStatus.status = awsProps.CREATING;

    win.webContents.send(events.HANDLE_STATUS_CHANGE, clusterStatus);

  } catch (err) {

    console.log('Error from CREATE_TECH_STACK: in main.js: ', err);

    errorData.type = awsProps.VPC_STACK_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating VPC Stack: ${err}`

    console.log("errorMessage: ", errorData);
    win.webContents.send(events.HANDLE_ERRORS, errorData);

  }

  // //** --------- CREATE AWS CLUSTER ---------------------------------- **//

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('============  ipcMain.on(events.CREATE_CLUSTER),... ==============')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    createdCluster = await awsEventCallbacks.createCluster(data.clusterName);
    console.log("createdCluster to return: ", createdCluster);
    
    clusterStatus.status = awsProps.CREATED;
    win.webContents.send(events.HANDLE_STATUS_CHANGE, clusterStatus);


    workerNodeStatus.type = awsProps.WORKER_NODE_STATUS,
    workerNodeStatus.status = awsProps.CREATING;
    win.webContents.send(events.HANDLE_STATUS_CHANGE, workerNodeStatus);

  } catch (err) {

    console.log('Error from CREATE_TECH_STACK: in main.js: ', err);

    errorData.type = awsProps.CLUSTER_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating Cluster: ${err}`;

    console.log("errorMessage: ", errorData);
    win.webContents.send(events.HANDLE_ERRORS, errorData);
  }

  //** ----- CREATE KUBECONFIG FILE, CONFIGURE KUBECTL, CREATE WORKER NODE STACK ---------- **//

  try {

    console.log("starting kube config");

    const configFileCreationStatus = await kubectlConfigFunctions.createConfigFile(data.clusterName);

    const kubectlConfigurationStatus = await kubectlConfigFunctions.configureKubectl(data.clusterName);

    const kubectlStatusTest = kubectlConfigFunctions.testKubectlGetSvc(data.clusterName);

    const workerNodeStackCreationStatus = await kubectlConfigFunctions.createStackForWorkerNode(data.clusterName);

    
    workerNodeStatus.status = awsProps.CREATED;
    win.webContents.send(events.HANDLE_STATUS_CHANGE, workerNodeStatus);

    kubectlConfigStatus.type = awsProps.KUBECTL_CONFIG_STATUS;
    kubectlConfigStatus.status = awsProps.CREATING;
    win.webContents.send(events.HANDLE_STATUS_CHANGE, kubectlConfigStatus);
  

  } catch (err) {

    console.log('Error from CREATE_TECH_STACK: in main.js: ', err);

    errorData.type = awsProps.WORKER_NODE_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while creating Worker Node Stack: ${err}`;

    console.log("errorMessage: ", errorData);
    win.webContents.send(events.HANDLE_ERRORS, errorData);

  }

  //** ----- CREATE NODE INSTANCE AND TEST KUBECTL CONFIG STATUS ---------- **//

  try {

    const nodeInstanceCreationStatus = await kubectlConfigFunctions.inputNodeInstance(data.clusterName);

    const kubectlConfigStatusTest = await kubectlConfigFunctions.testKubectlStatus();
    console.log("final status: ", kubectlConfigStatusTest);

    if (kubectlConfigStatusTest === true) {
      kubectlConfigStatus.status = awsProps.CREATED;

      console.log('kubectlConfigStatus.status: ', kubectlConfigStatus.status);

      win.webContents.send(events.HANDLE_STATUS_CHANGE, kubectlConfigStatus);

      console.log("moving along");

      win.webContents.send(events.HANDLE_NEW_NODES, kubectlConfigStatusTest);


    } else {
      win.webContents.send(events.HANDLE_ERRORS, "An error ocurred while configuring kubectl");
    }


  } catch (err) {

    console.log('Error from configuring Kubectl', err);

    errorData.type = awsProps.KUBECTL_CONFIG_STATUS;
    errorData.status = awsProps.ERROR;
    errorData.errorMessage = `Error occurred while configuring kubectl: ${err}`;

    console.log("errorMessage: ", errorData);
    win.webContents.send(events.HANDLE_ERRORS, errorData);

  }
})


//** --------------------------------------------------------------------------- **//
//** ----------------------- FUNCTION TO SEND CLUSTER DATA TO DISPLAY ---------- **//
//** --------------------------------------------------------------------------- **//

//** ------- EXECUTES ON EVERY OPENING OF APPLICATION -------------------------- **//
//** ------- Check credentials file to determine if user needs to configure the application **// 
//If credential's file hasn't been created yet (meaning user hasn't entered credentials previously), 
//serve HomeComponent page, else, serve HomeComponentPostCredentials
ipcMain.on(events.GET_CLUSTER_DATA, async (event, data) => {

  try {

    const dataFromCredentialsFile = await fsp.readFile(process.env['AWS_STORAGE'] + `AWS_Private/awsCredentials.json`, 'utf-8');

    const parsedCredentialsFileData = JSON.parse(dataFromCredentialsFile);

    console.log("parsedCredentialsFileData: ", parsedCredentialsFileData);

    const clusterName = parsedCredentialsFileData.clusterName;

    const dataFromMasterFile = await fsp.readFile(process.env['AWS_STORAGE'] + `AWS_Private/${clusterName}_MASTER_FILE.json`, 'utf-8');

    const parsedAWSMasterFileData = JSON.parse(dataFromMasterFile);

    delete parsedAWSMasterFileData.certificateAuthorityData;

    console.log("parsedAWSMasterFileData: ", parsedAWSMasterFileData);
    win.webContents.send(events.SEND_CLUSTER_DATA, parsedAWSMasterFileData);

  } catch (err) {
    console.log(err);
  }

})




//** --------------------------------------------------------------------------- **//
//** ----------------------- KUBECTL EVENTS ------------------------------------ **//
//** --------------------------------------------------------------------------- **//

//**----------- CREATE A KUBERNETES POD ------------------------------ **//
//Pass user input into createPodYamlTemplate method to generate template
//Create a pod based on that template, launch pod via kubectl
//** ---------- Get the Master Node ------------------- **//
// run 'kubectl get svc -o=json' to get the services, one element in the item array will contain
// the apiserver. result.items[x].metadata.labels.component = "apiserver"
// this is our master node so send this back
ipcMain.on(events.GET_MASTER_NODE, async (event, data) => {
  try {
    // run kubctl
    const apiServiceData = spawnSync('kubectl', ['get', 'svc', '-o=json']);
    // string the data and log to the console;
    const stdout = apiServiceData.stdout.toString();
    const stdoutParsed = JSON.parse(stdout);
    const stderr = apiServiceData.stderr.toString();
    const clusterApiData = stdoutParsed.items.find((item) => {
      return item.metadata.labels.component === 'apiserver';
    });
    win.webContents.send(events.HANDLE_MASTER_NODE, clusterApiData);
  } catch (err) {
    console.log('error from the GET_MASTER_NODE event listener call back in main.js', err)
    win.webContents.send(events.HANDLE_MASTER_NODE, err);
  }
})

//** -------------- Get the Worker Nodes -------------------- **//

ipcMain.on(events.GET_WORKER_NODES, async (event, data) => {
  try {
    const apiNodeData = spawnSync('kubectl', ['get', 'nodes', '-o=json'])
    const stdout = apiNodeData.stdout.toString();
    const stdoutParsed = JSON.parse(stdout);
    const stderr = apiNodeData.stderr.toString();
    console.log('stdout GET_WORKER_NODES: ', stdoutParsed);
    console.log('stdout type: ', typeof stdoutParsed);
    console.log('stderr', stderr);
    win.webContents.send(events.HANDLE_WORKER_NODES, stdoutParsed);
  } catch (err) {
    console.log('error from the GET_WORKER_NODES event listener call back in main.js', err);
    win.webContents.send(events.HANDLE_WORKER_NODES, err);
  }
})


//** -------------- Get the Containers and Pods -------------------- **//

ipcMain.on(events.GET_CONTAINERS_AND_PODS, async (event, data) => {
  try {
    const apiNodeData = spawnSync('kubectl', ['get', 'pods', '-o=json'])
    const stdout = apiNodeData.stdout.toString();
    const stdoutParsed = JSON.parse(stdout);
    const stderr = apiNodeData.stderr.toString();
    console.log('stdout PODS: ', stdoutParsed);
    console.log('stderr', stderr);
    win.webContents.send(events.HANDLE_CONTAINERS_AND_PODS, stdoutParsed);
  } catch (err) {
    console.log('error from the GET_CONTAINERS_AND_PODS event listener call back in main.js', err);
    win.webContents.send(events.HANDLE_CONTAINERS_AND_PODS, err);
  }
})

//**----------- CREATE A POD -------------------------------- **//

ipcMain.on(events.CREATE_POD, async (event, data) => {
  try{
    console.log('data.podName: ', data.podName);
    // CREATE AND WRITE THE POD FILE FROM TEMPLATE
    const podYamlTemplate = kubernetesTemplates.createPodYamlTemplate(data);
    let stringifiedPodYamlTemplate = JSON.stringify(podYamlTemplate, null, 2);
    await fsp.writeFile(process.env['KUBECTL_STORAGE'] + `pod_${data.podName}.json`, stringifiedPodYamlTemplate)
    // CREATE THE POD VIA kubectl
    const child = spawnSync('kubectl', ['apply', '-f', process.env['KUBECTL_STORAGE'] + `pod_${data.podName}.json`]);
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();
    console.log('stdout', stdout, 'stderr', stderr);
    // SEND STDOUT TO RENDERER PROCESS
    await awsHelperFunctions.timeout(1000 * 5)
    win.webContents.send(events.HANDLE_NEW_POD, stdout);
  } catch (err) {
    console.log('err', err);
  }
});


  //** ----- DELETE A NODE ---------- **//
  ipcMain.on(events.DELETE_NODE, async (event, data) => {
    console.log("delete triggered on main")
    try{
      console.log('data.data.name: ', data);
      // CREATE AND WRITE THE POD FILE FROM TEMPLATE
      // const podYamlTemplate = kubernetesTemplates.createPodYamlTemplate(data);
      // let stringifiedPodYamlTemplate = JSON.stringify(podYamlTemplate, null, 2);
      // await fsp.writeFile(process.env['KUBECTL_STORAGE'] + `pod_${data.podName}.json`, stringifiedPodYamlTemplate)
      // DELETE THE POD VIA kubectl
      const deploymentName = data.data.name.split('-')[0];
      const child = spawnSync('kubectl', ['delete', 'deployment', deploymentName]);
      const stdout = child.stdout.toString();
      const stderr = child.stderr.toString();
      console.log('stdout', stdout, 'stderr', stderr);
      // SEND STDOUT TO RENDERER PROCESS
      await awsHelperFunctions.timeout(1000 * 10)
      win.webContents.send(events.HANDLE_DELETE_NODE);
    } catch (err) {
      console.log('err', err);
    }
  });


//**-----------------------SERVICE--------------------------------**//

//BUILD A SERVICE YAML
ipcMain.on(events.CREATE_SERVICE, async (event, data) => {
  try {
    console.log("CREATE_SERVICE data:", data);
    // CREATE AND WRITE THE SERVICE FILE FROM TEMPLATE
    const serviceYamlTemplate = kubernetesTemplates.createServiceYamlTemplate(data);
    let stringifiedServiceYamlTemplate = JSON.stringify(serviceYamlTemplate, null, 2);
    await fsp.writeFile(process.env['KUBECTL_STORAGE'] + `service_${data.serviceName}.json`, stringifiedServiceYamlTemplate);
    // CREATE THE SERVICE VIA kubectl
    const child = spawnSync('kubectl', ['apply', '-f', process.env['KUBECTL_STORAGE'] + `service_${data.serviceName}.json`]);
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();
    console.log('stdout', stdout, 'stderr', stderr);
    // SEND STDOUT TO RENDERER PROCESS
    win.webContents.send(events.HANDLE_NEW_SERVICE, stdout);
  } catch (err) {
    console.log('err', err);
  }
});

//**--------------DEPLOYMENT-----------------**//

//CREATE DEPLOYMENT 
ipcMain.on(events.CREATE_DEPLOYMENT, async (event, data) => {
  try {
    console.log("data from replicas: ", data);
    if (data.replicas > 5) throw new Error(`Replica amount entered was ${data.replicas}. This value has to be 5 or less.`)
    // CREATE AND WRITE THE DEPLOYMENT FILE FROM TEMPLATE
    const deploymentYamlTemplate = kubernetesTemplates.createDeploymentYamlTemplate(data);
    let stringifiedDeploymentYamlTemplate = JSON.stringify(deploymentYamlTemplate, null, 2);
    await fsp.writeFile(process.env['KUBECTL_STORAGE'] + `deployment_${data.deploymentName}.json`, stringifiedDeploymentYamlTemplate);
    // CREATE THE DEPOYMENT VIA kubectl
    const child = spawnSync("kubectl", ["create", "-f", process.env['KUBECTL_STORAGE'] + `deployment_${data.deploymentName}.json`]);
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();
    console.log('stdout', stdout, 'stderr', stderr);
    // SEND STDOUT TO RENDERER PROCESS
    win.webContents.send(events.HANDLE_NEW_DEPLOYMENT, stdout);
  } catch (err) {
    console.log('err', err)
  }
});

//** --------- APPLICATION OBJECT EVENT EMITTERS ---------- **//
// HANDLE app ready
app.on('ready', createWindowAndSetEnvironmentVariables);

// HANDLE app shutdown
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindowAndSetEnvironmentVariables();
  }
});
