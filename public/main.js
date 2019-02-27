const { electron, app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
require('dotenv').config();

const fs = require('fs');
const { spawn, spawnSync } = require('child_process');
const fsp = require('fs').promises;

const YAML = require('yamljs');

//** --------- IMPORT RESOURCE FILES ---------
const events = require('../eventTypes.js')
const awsEventCallbacks = require(__dirname + '/helperFunctions/awsEventCallbacks'); 
const awsHelperFunctions = require(__dirname + '/helperFunctions/awsHelperFunctions'); 
const awsParameters = require(__dirname + '/helperFunctions/awsParameters');
const kubernetesTemplates = require(__dirname + '/helperFunctions/kubernetesTemplates');
const kubectlConfigFunctions = require(__dirname + '/helperFunctions/kubectlConfigFunctions');
const onDownload = require(__dirname + '/helperFunctions/onDownloadFunctions');

//** --------- IMPORT DOCUMENTS ---------------- 
const iamRolePolicyDocument = require(__dirname + '/sdkAssets/samples/iamRoleTrustPolicy.json');
const stackTemplate = require(__dirname + '/sdkAssets/samples/amazon-stack-template-eks-vpc-real.json');

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

// const eks = new EKS({ region: REGION });
//const cloudformation = new CloudFormation({ region: REGION });
//const awsConfig = new AWSConfig();

//** --------- CREATE WINDOW OBJECT --------
let win;

//Function to create our application window, that will be invoked with app.on('ready')
function createWindowAndSetEnvironmentVariables () {

  if (isDev) {
    process.env['APPLICATION_PATH'] = __dirname;
    BrowserWindow.addDevToolsExtension(REACT_DEV_TOOLS_PATH)
    console.log("process.env['APPLICATION_PATH'] inside if isDev, createWindowAndSetEnvironmentVariables: ", process.env['APPLICATION_PATH'])

  } else {
    process.env['APPLICATION_PATH'] = process.env['HOME'] + '/Library/Application Support/kre8';
  }

  // Read from credentials file and store the environment variables
  if (fs.existsSync(process.env['APPLICATION_PATH'] + '/sdkAssets/private/awsCredentials.json')) {
    const readCredentialsFile = fs.readFileSync(process.env['APPLICATION_PATH'] + '/sdkAssets/private/awsCredentials.json', 'utf-8');
    const parsedCredentialsFile = JSON.parse(readCredentialsFile);
    Object.entries(parsedCredentialsFile).forEach((arr) => {
      process.env[arr[0]] = arr[1];
    });
  }

  win = new BrowserWindow({width: 1400, height: 900});

  win.loadURL(isDev ? `http://localhost:${PORT}` : `file://${path.join(__dirname, 'dist/index.html')}`)
  win.on('closed', () => win = null)
}



//** -------------------------------------------------------------- **//
//** ----------------------- AWS SDK EVENTS ----------------------- **//
//** -------------------------------------------------------------- **//


//** --------- FUNCTIONS TO EXECUTE ON DOWNLOAD ------------------ **//

//TODO: Braden convert to on startup function perform once
ipcMain.on(events.INSTALL_IAM_AUTHENTICATOR, async (event, data) => {
  
  try {

    const iamAuthenticatorExists = fs.existsSync(process.env['HOME'] + '/bin/aws-iam-authenticator');
    if (!iamAuthenticatorExists) {
      await onDownload.installIAMAuthenticator();
      await onDownload.enableIAMAuthenticator();
      await onDownload.copyToBinFolder();
    }
    await onDownload.appendToBashProfile();

  } catch (err) {
    console.log(err);
  }

  win.webContents.send(events.HANDLE_NEW_ROLE, 'New Role Name Here');
})


//** --------- CONFIGURE AWS CREDENTIALS --------------------------- **//
ipcMain.on(events.SET_AWS_CREDENTIALS, async (event, data) => {

  console.log('data', data);

  try {

    awsEventCallbacks.configureAWSCredentials(data);
    const credentialStatus = await sts.getCallerIdentity().promise();
    console.log("credentialStatus: ", credentialStatus);

    win.webContents.send(events.HANDLE_AWS_CREDENTIALS, credentialStatus);
    
  } catch (err) {
    console.log(err);
    //TODO: send back whether or not data worked to the front end
    win.webContents.send(events.HANDLE_AWS_CREDENTIALS, 'Main thread threw an error');
  }
  
  win.webContents.send(events.HANDLE_AWS_CREDENTIALS, 'hello');

})

//** --------- CREATE AWS IAM ROLE + ATTACH POLICY DOCS ---------- **//
ipcMain.on(events.CREATE_IAM_ROLE, async (event, data) => {

  let iamRoleCreated;

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('============  ipcMain.on(events.CREATE_IAM_ROLE,... =================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    //Data from user input + imported policy document
    const iamRoleName = data.roleName;
    const iamRoleDescription = data.description;
    const iamRolePolicyDoc = iamRolePolicyDocument;

    //create 
    iamRoleCreated = await awsEventCallbacks.createIAMRole(iamRoleName, iamRoleDescription, iamRolePolicyDoc);
  } catch (err) {
    console.log('Error from CREATE_IAM_ROLE in main.js:', err);
}
  //TODO: decide what to return to the the user

  win.webContents.send(events.HANDLE_NEW_ROLE, iamRoleCreated);
})

//** ------ CREATE AWS TECH STACK + SAVE RETURNED DATA IN FILE ---- **//
//Takes approx 1 - 1.5 mins to create stack and get data back from AWS
ipcMain.on(events.CREATE_TECH_STACK, async (event, data) => {

  let createdStack;

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('============  ipcMain.on(events.CREATE_TECH_STACK,... ===============')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    // FIXME: should the stack template be stringified inside of the awsParameters just like
    // the iamCreateRole process like above?
    const stackTemplateStringified = JSON.stringify(stackTemplate);
    const techStackName = data.stackName;

    createdStack = await awsEventCallbacks.createTechStack(techStackName, stackTemplateStringified);

  } catch (err) {
    console.log('Error from CREATE_TECH_STACK: in main.js: ', err);
  }

  //TODO: decide what to send back to user. Now juse sends stackName
  win.webContents.send(events.HANDLE_NEW_TECH_STACK, createdStack);
})

//** --------- CREATE AWS CLUSTER ---------------------------------- **//
ipcMain.on(events.CREATE_CLUSTER, async (event, data) => {

  //Collect form data, input by the user when creating a Cluster, and insert into clusterParams object
  const clusterName = data.clusterName;

  let createdCluster;
  try {
    createdCluster = await awsEventCallbacks.createCluster(clusterName);
  } catch (err) {
    console.log('Error from CREATE_CLUSTER event listener in main.js:', err);
  }

  win.webContents.send(events.HANDLE_NEW_CLUSTER, createdCluster);
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
  fs.writeFile(process.env['APPLICATION_PATH'] + `/yamlAssets/private/pods/${data.podName}.json`,
  stringifiedPodYamlTemplate, (err) => {
      if (err) {
        return console.log(err);
      } else {
      console.log("You made a pod Yaml!!!!");
    }
  });

  //CREATE POD AND INSERT INTO MINIKUBE
  const child = spawn('kubectl', ['apply', '-f', process.env['APPLICATION_PATH'] + `/yamlAssets/private/pods/${data.podName}.json`]);
  
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
  fs.writeFile(process.env['APPLICATION_PATH'] + `/yamlAssets/private/services/${data.serviceName}.json`, stringifiedServiceYamlTemplate, (err) => {
      if (err) {
        console.log(err);
      }
      console.log("You made a service Yaml!!!!");
    }
  );


  //CREATE SERVICE AND INSERT INTO MINIKUBE
  const child = spawn("kubectl", ["create", "-f", process.env['APPLICATION_PATH'] + `/yamlAssets/private/services/${data.serviceName}.json`]);
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
    process.env['APPLICATION_PATH'] + `/yamlAssets/private/deployments/${data.deploymentName}.json`,
    stringifiedDeploymentYamlTemplate,
    function(err) {
      if (err) {
        return console.log(err);
      }
      console.log("You made a deployment Yaml!!!!");
    }
  );


  //CREATE DEPLOYMENT AND INSERT INTO MINIKUBE
  const child = spawn("kubectl", ["create", "-f", process.env['APPLICATION_PATH'] + `/yamlAssets/private/deployments/${data.deploymentName}.json`]);
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
    createWindow();
  }
});

