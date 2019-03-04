const { electron, app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
require('dotenv').config();

const fs = require('fs');
const fsp = require('fs').promises;
const mkdirp = require('mkdirp');
const { spawn, spawnSync } = require('child_process');

const YAML = require('yamljs');

//** --------- IMPORT RESOURCE FILES ---------
const events = require('../eventTypes.js')
const awsEventCallbacks = require(__dirname + '/helperFunctions/awsEventCallbacks'); 
const awsHelperFunctions = require(__dirname + '/helperFunctions/awsHelperFunctions'); 
const awsParameters = require(__dirname + '/helperFunctions/awsParameters');
const kubernetesTemplates = require(__dirname + '/helperFunctions/kubernetesTemplates');
const kubectlConfigFunctions = require(__dirname + '/helperFunctions/kubectlConfigFunctions');
const onDownload = require(__dirname + '/helperFunctions/onDownloadFunctions');

// //** --------- IMPORT DOCUMENTS ---------------- 
// const iamRolePolicyDocument = require(__dirname + '/sdkAssets/samples/iamRoleTrustPolicy.json');
// const stackTemplate = require(__dirname + '/sdkAssets/samples/amazon-stack-template-eks-vpc-real.json');

//** --------- IMPORT AWS SDK ELEMENTS --------- 
const EKS = require('aws-sdk/clients/eks');
const IAM = require('aws-sdk/clients/iam');
const CloudFormation = require('aws-sdk/clients/cloudformation');
const STS = require('aws-sdk/clients/sts');

//** --------- .ENV Variables -------------- 
//let REGION = process.env.REGION;
const PORT = process.env.PORT;
const REACT_DEV_TOOLS_PATH = process.env.REACT_DEV_TOOLS_PATH;

//** --------- INITIALIZE SDK IMPORTS ------ 

const sts = new STS();
const eks = new EKS();
const cloudformation = new CloudFormation();
const iam = new IAM();

//const eks = new EKS({ region: REGION });
//const cloudformation = new CloudFormation({ region: REGION });
//const awsConfig = new AWSConfig();

//** --------- CREATE WINDOW OBJECT -------------------------------------------- **//
let win;

//Invoked with app.on('ready'): creates application window, serves either dev or production version of app and
//sets necessary environment variables
function createWindowAndSetEnvironmentVariables () {

  if (isDev) {
    process.env['APPLICATION_PATH'] = __dirname;
    process.env['AWS_STORAGE'] = process.env['APPLICATION_PATH'] + '/Storage/AWS_Assets/';
    process.env['KUBECTL_STORAGE'] = process.env['APPLICATION_PATH'] + '/Storage/KUBECTL_Assets'
    BrowserWindow.addDevToolsExtension(REACT_DEV_TOOLS_PATH)
    console.log("process.env['APPLICATION_PATH'] inside if isDev, createWindowAndSetEnvironmentVariables: ", process.env['APPLICATION_PATH'])
    mkdirp.sync(process.env['AWS_STORAGE']);
    mkdirp.sync(process.env['KUBECTL_STORAGE']);

  } else {
    process.env['APPLICATION_PATH'] = process.env['HOME'] + '/Library/Application\ Support/KRE8';
    process.env['AWS_STORAGE'] = process.env['APPLICATION_PATH'] + `/Storage/AWS_Assets/`;
    process.env['KUBECTL_STORAGE'] = process.env['APPLICATION_PATH'] + '/Storage/KUBECTL_Assets'

    //TODO: check if we need to create this, or if in the configuration of electron we do it then
    mkdirp.sync(process.env['AWS_STORAGE']);
    mkdirp.sync(process.env['KUBECTL_STORAGE']);
  }

  //If awsCredentials file has already been created, use data to set required AWS Environment Variables: 
  //AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, REGION
  if (fs.existsSync(process.env['AWS_STORAGE'] + 'awsCredentials.json')) {
    const readCredentialsFile = fs.readFileSync(process.env['AWS_STORAGE'] + 'awsCredentials.json', 'utf-8');
    const parsedCredentialsFile = JSON.parse(readCredentialsFile);
    Object.entries(parsedCredentialsFile).forEach((arr) => {
      process.env[arr[0]] = arr[1];
    });
  }

  win = new BrowserWindow({width: 1080, height: 810});

  win.loadURL(isDev ? `http://localhost:${PORT}` : `file://${path.join(__dirname, 'dist/index.html')}`)
  win.on('closed', () => win = null)
}


//TODO: Braden convert to on startup function perform once
//** --------- EXECUTES ON DOWNLOAD -------------------------------------------- **//
//** --------- Check for & install aws-iam-authenticator ----------------------- **//
//To communicate with AWS, user must have the aws-iam-authenticator installed
//These functions check if authenticator is already installed in user's bin folder
//If not, the authenticator will be installed, and the path will be defined in the user's 
//.bash_profile file, which is where AWS specifies it should be
ipcMain.on(events.INSTALL_IAM_AUTHENTICATOR, async (event, data) => {
  
  try {
    const iamAuthenticatorExists = fs.existsSync(process.env['HOME'] + '/bin/aws-iam-authenticator');

    if (!iamAuthenticatorExists) {
      onDownload.installIAMAuthenticator();
      onDownload.enableIAMAuthenticator();
      onDownload.copyIAMAuthenticatorToBinFolder();
    }

    await onDownload.setPATHAndAppendToBashProfile();

  } catch (err) {
    console.log(err);
  }

  //TODO: Braden, should we delete this, since not sending any info to frontend
  //win.webContents.send(events.HANDLE_NEW_ROLE, 'New Role Name Here');
})

//** ------- EXECUTES ON EVERY OPENING OF APPLICATION -------------------------- **//
//** ------- Check credentials file to determine if user needs to configure the application **// 
//If credential's file hasn't been created yet (meaning user hasn't entered credentials previously), 
//serve HomeComponent page, else, serve HomeComponentPostCredentials
ipcMain.on(events.CHECK_CREDENTIAL_STATUS, async (event, data) => {

  try {
    const credentialStatusToReturn = await awsEventCallbacks.returnCredentialsStatus(data);
    console.log("credentialStatusToReturn: ", credentialStatusToReturn)
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

      await awsEventCallbacks.updateCredentialsFileWithCredentialStatus();

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

//** --------------------------------------------------------------------------- **//
//** ----------------------- AWS SDK EVENTS ------------------------------------ **//
//** --------------------------------------------------------------------------- **//


//** --------- EXECUTES ON FIRST INTERACTION WITH APP WHEN USER SUBMITS DATA FROM PAGE 2, AWS CONTAINER ----- **//
//** --------- Takes 10 - 15 minutes to complete ------------------------------------------------------------ **//
//** --------- Creates AWS account components: IAM Role, Stack, Cluster, Worker Node Stack ------------------ **//


ipcMain.on(events.CREATE_IAM_ROLE, async (event, data) => {

  try {

    //** --------- CREATE AWS IAM ROLE + ATTACH POLICY DOCS ---------------------------
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('============  ipcMain.on(events.CREATE_IAM_ROLE)... =================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    iamRoleStatusData = await awsEventCallbacks.createIAMRole(data.iamRoleName);

    console.log("iamRoleCreated data to send: ", iamRoleStatusData);

    //TODO: Do someting with the IAM Role Created Data on the front end
    win.webContents.send(events.HANDLE_NEW_ROLE, iamRoleStatusData);

  } catch (err) {
    console.log('Error from CREATE_IAM_ROLE in main.js:', err);
  }

  //** ------ CREATE AWS STACK + SAVE RETURNED DATA IN FILE ---- **//
  //Takes approx 1 - 1.5 mins to create stack and get data back from AWS

  let createdStack;

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('============  ipcMain.on(events.CREATE_TECH_STACK),... ==============')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    // FIXME: should the stack template be stringified inside of the awsParameters just like
    // the iamCreateRole process like above?
    const vpcStackName = data.vpcStackName;

    createdStack = await awsEventCallbacks.createVPCStack(vpcStackName, data.iamRoleName);
    win.webContents.send(events.HANDLE_NEW_TECH_STACK, createdStack);


  } catch (err) {
    console.log('Error from CREATE_TECH_STACK: in main.js: ', err);
    win.webContents.send(events.HANDLE_NEW_TECH_STACK, err);

  }

  //TODO: decide what to send back to user. Now just sends stackName
})








//** --------- CREATE AWS CLUSTER ---------------------------------- **//
ipcMain.on(events.CREATE_CLUSTER, async (event, data) => {

  try {
    createdCluster = await awsEventCallbacks.createCluster(data.clusterName, data.iamRoleName);
    win.webContents.send(events.HANDLE_NEW_CLUSTER, createdCluster);

  } catch (err) {
    console.log('Error from CREATE_CLUSTER event listener in main.js:', err);
    win.webContents.send(events.HANDLE_NEW_CLUSTER, err);
  }

  
});


//TODO: No button should be used, should auto happen after last thing completes

//** --------- TESTING BUTTON  ---------------------------------- **//


ipcMain.on(events.CONFIG_KUBECTL_AND_MAKE_NODES, async (event, data) => {

  //TODO: Test .includes on bash profile
     //read the bash profile
      //stringify the contents
      //check if teh file contains "KUBECONFIG"
      //if not, proceed
      //if so:
        //



  win.webContents.send(events.HANDLE_NEW_NODES, 'Nodes were made from the main thread')
})


//** ----------KUBECTL EVENTS WILL GO HERE ------------------- **//

// KUBECTL EVENTS - CREATE POD (EXAMPLE)
// ipcMain.on(events.CREATE_POD, (event, data) => {
//   win.webContents.send(events.HANDLE_NEW_POD, 'New Pod Here');
// })

//**----------- CREATE A POD -------------------------------- **//

ipcMain.on(events.CREATE_POD, (event, data) => {
  
  // Pass user input into createPodYamlTemplate method to generate template
  console.log('data.podName: ', data.podName);
  const podYamlTemplate = kubernetesTemplates.createPodYamlTemplate(data);

  let stringifiedPodYamlTemplate = JSON.stringify(podYamlTemplate);

  //WRITE A NEW POD YAML FILE
  
  fs.writeFile(process.env['KUBECTL_STORAGE'] + `/pods/${data.podName}.json`,
  stringifiedPodYamlTemplate, (err) => {
      if (err) {
        return console.log(err);
      } else {
      console.log("You made a pod Yaml!!!!");
    }
  });

  //CREATE POD AND INSERT INTO MINIKUBE
  const child = spawn('kubectl', ['apply', '-f', process.env['KUBECTL_STORAGE'] + `/pods/${data.podName}.json`]);
  
    console.log("podCreator");
    child.stdout.on("data", info => {
      console.log(`stdout: ${info}`);
      win.webContents.send(events.HANDLE_NEW_POD, `${info}`);
    });
    child.stderr.on("data", info => {
      console.log(`stderr: ${info}`);
    });
    child.on("close", code => {
      console.log(`child process exited with code ${code}`);
    });
});



//**-----------------------SERVICE--------------------------------**//

//BUILD A SERVICE YAML
ipcMain.on(events.CREATE_SERVICE, (event, data) => {
  console.log("data:", data);

  const serviceYamlTemplate = kubernetesTemplates.createServiceYamlTemplate(data);

  //SERVICE YAML TEMPLATE
  // const serviceYamlTemplate = {
  //   apiVersion: "v1",
  //   kind: "Service",
  //   metadata: {
  //     name: `${data.name}`
  //   },
  //   spec: {
  //     selector: {
  //       app: `${data.appName}`
  //     },
  //     ports: [
  //       {
  //         protocol: "TCP",
  //         port: `${data.port}`,
  //         targetPort: `${data.targetPort}`
  //       }
  //     ]
  //   }
  // }
    
  let stringifiedServiceYamlTemplate = JSON.stringify(serviceYamlTemplate);

  //WRITE A NEW SERVICE YAML FILE
  fs.writeFile(process.env['KUBECTL_STORAGE'] + `/services/${data.serviceName}.json`, stringifiedServiceYamlTemplate, (err) => {
      if (err) {
        console.log(err);
      }
      console.log("You made a service Yaml!!!!");
    }
  );


  //CREATE SERVICE AND INSERT INTO MINIKUBE
  const child = spawn("kubectl", ["create", "-f", process.env['KUBECTL_STORAGE'] + `/services/${data.serviceName}.json`]);
    console.log("serviceCreator");
    child.stdout.on("data", data => {
      console.log(`stdout: ${data}`);
      win.webContents.send(events.HANDLE_NEW_SERVICE, `${data}`);
    });
    child.stderr.on("data", data => {
      console.log(`stderr: ${data}`);
    });
    child.on("close", code => {
      console.log(`child process exited with code ${code}`);
    });
});





//**--------------DEPLOYMENT-----------------**//

//CREATE DEPLOYMENT 
ipcMain.on(events.CREATE_DEPLOYMENT, (event, data) => {
  
  console.log("data.deploymentName: ", data.deploymentName);

  const deploymentYamlTemplate = kubernetesTemplates.createDeploymentYamlTemplate(data);

  //DEPLOYMENT YAML TEMPLATE
  // const deploymentYaml = {
  //   apiVersion: "apps/v1",
  //   kind: "Deployment",
  //   metadata: {
  //     name: `${data.deploymentName}`,
  //     labels: {
  //       app: `${data.appName}`
  //     }
  //   },
  //   spec: {
  //     replicas: `${data.replicas}`,
  //     selector: {
  //       matchLabels: {
  //         app: `${data.appName}`
  //       }
  //     },
  //     template: {
  //       metadata: {
  //         labels: {
  //           app: `${data.appName}`
  //         }
  //       },
  //       spec: {
  //         containers: [
  //           {
  //             name: `${data.containerName}`,
  //             image: `${data.image}`,
  //             ports: [
  //               {
  //                 containerPort: `${data.containerPort}`
  //               }
  //             ]
  //           }
  //         ]
  //       }
  //     }
  //   }
  // };

  let stringifiedDeploymentYamlTemplate = JSON.stringify(deploymentYamlTemplate);

  //WRITE A NEW DEPLOYENT YAML FILE
  fs.writeFile(
    process.env['KUBECTL_STORAGE'] + `/deployments/${data.deploymentName}.json`,
    stringifiedDeploymentYamlTemplate,
    function(err) {
      if (err) {
        return console.log(err);
      }
      console.log("You made a deployment Yaml!!!!");
    }
  );


  //CREATE DEPLOYMENT AND INSERT INTO MINIKUBE
  const child = spawn("kubectl", ["create", "-f", process.env['KUBECTL_STORAGE'] + `/deployments/${data.deploymentName}.json`]);
    console.log("deploymentCreator");
    child.stdout.on("data", info => {
      console.log(`stdout: ${info}`);
      win.webContents.send(events.HANDLE_NEW_DEPLOYMENT, `${info}`);
    });
    child.stderr.on("data", info => {
      console.log(`stderr: ${info}`);
    });
    child.on("close", code => {
      console.log(`child process exited with code ${code}`);
    });
});


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

