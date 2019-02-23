const { electron, app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
require('dotenv').config();

const fs = require('fs');
const { spawn } = require('child_process');
const fsp = require('fs').promises;

const YAML = require('yamljs');

//** --------- IMPORT RESOURCE FILES --------- 
const events = require('../eventTypes.js')
const awsEventCallbacks = require(__dirname + '/helperFunctions/awsEventCallbacks'); 
const awsHelperFunctions = require(__dirname + '/helperFunctions/awsHelperFunctions'); 
const awsParameters = require(__dirname + '/helperFunctions/awsParameters');
const kubectlConfigFunctions = require(__dirname + '/helperFunctions/kubectlConfigFunctions');

//** --------- IMPORT AWS SDK ELEMENTS --------- 
const EKS = require('aws-sdk/clients/eks');
const IAM = require('aws-sdk/clients/iam');
const CloudFormation = require('aws-sdk/clients/cloudformation');

//** --------- IMPORT DOCUMENTS ---------------- 
const iamRolePolicyDocument = require(__dirname + '/sdkAssets/samples/iamRoleTrustPolicy.json');
const stackTemplate = require(__dirname + '/sdkAssets/samples/amazon-stack-template-eks-vpc-real.json');
const workerNodeJsonAuthFile = require(__dirname + '/sdkAssets/private/aws-auth-cm.json');

//** --------- .ENV Variables -------------- 
const REGION = process.env.REGION;
const PORT = process.env.PORT;
const REACT_DEV_TOOLS_PATH = process.env.REACT_DEV_TOOLS_PATH;

//** --------- INITIALIZE SDK IMPORTS ------ 
const iam = new IAM()
const eks = new EKS({ region: REGION});
const cloudformation = new CloudFormation({ region: REGION});

//** --------- CREATE WINDOW OBJECT --------
let win;

//Function to create our application window, that will be invoked with app.on('ready')
function createWindow () {
  win = new BrowserWindow({width: 1200, height: 800});
  
  if (isDev) {
  // adding react dev tools for developement
    BrowserWindow.addDevToolsExtension(REACT_DEV_TOOLS_PATH)
  }

  win.loadURL(isDev ? `http://localhost:${PORT}` : `file://${path.join(__dirname, 'dist/index.html')}`)
  win.on('closed', () => win = null)
}

//** -------------------------------------------------------------- **//
//** ----------------------- AWS SDK EVENTS ----------------------- **//
//** -------------------------------------------------------------- **//

//TODO BRADON: have user decide their region...

//** --------- INSTALL AWS IAM AUTHENTICATOR FOR EKS -------------- **//
ipcMain.on(events.INSTALL_IAM_AUTHENTICATOR, (event, data) => {
  const child = spawn('curl', ['-o', 'aws-iam-authenticator', 'https://amazon-eks.s3-us-west-2.amazonaws.com/1.11.5/2018-12-06/bin/darwin/amd64/aws-iam-authenticator']);
    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    })
    child.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    })
    child.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      win.webContents.send(events.HANDLE_NEW_ROLE, 'New Role Name Here');
    });
})

//TODO: ADD FUNCTIONS:
//APPLY EXECUTE PERMISSIONS TO THE BINARY FILE 
//COPY AWS-IAM-AUTHENTICATOR FILE TO BIN FOLDER IN USER HOME DIRECTORY
//APPEND PATH TO BASH_PROFILE FILE


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
    console.log(err);
}
  //TODO decide what to return to the the user

  win.webContents.send(events.HANDLE_NEW_ROLE, iamRoleCreated);
})

//** ------ CREATE AWS TECH STACK + SAVE RETURNED DATA IN FILE ---- **//
//Takes approx 1 - 1.5 mins to create stack and get data back from AWS
ipcMain.on(events.CREATE_TECH_STACK, async (event, data) => {

  let createdStack;

  try {
    const stackTemplateStringified = JSON.stringify(stackTemplate);
    const techStackName = data.stackName;

    createdStack = await awsEventCallbacks.createTechStack(techStackName, stackTemplateStringified);

  } catch (err) {
    console.log(err);
  }

  //TODO decide what to send back to user. Now juse sends stackName
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
    console.log(err);
  }

  win.webContents.send(events.HANDLE_NEW_CLUSTER, createdCluster);
});


//TODO No button should be used, should auto happen after last thing completes

//** --------- TESTING BUTTON  ---------------------------------- **//


ipcMain.on(events.CONFIG_KUBECTL_AND_MAKE_NODES, async (event, data) => {

  //TODO Test .includes on bash profile


  win.webContents.send(events.HANDLE_NEW_NODES, 'Nodes were made from the main thread')
})


//** ----------KUBECTL EVENTS WILL GO HERE ------------------------- **//

// KUBECTL EVENTS - CREATE POD (EXAMPLE)
// ipcMain.on(events.CREATE_POD, (event, data) => {
//   win.webContents.send(events.HANDLE_NEW_POD, 'New Pod Here');
// })

//**-----------POD-----------**//

//TODO Modularize YAML creation

//CREATE POD 
ipcMain.on(events.CREATE_POD, (event, data) => {
  
  // Build Pod Yaml
  console.log('data.podName: ', data.podName);

  //POD YAML TEMPLATE
  const podYaml = {
    apiVersion: "v1",
    kind: "Pod",
    metadata: {
      name: `${data.podName}`,
      labels: {
        app: "myapp"
      }
    },
    spec: {
      containers: [
        {
          name: `${data.containerName}`,
          image: `${data.imageName}`,
          imagePullPolicy: "Always",
          env: [
            {
              name: "DEMO_GREETING",
              value: "Hello from the environment"
            }
          ],
          command: ["sh", "-c", "echo Hello Kubernetes! && sleep 3600"]
        }
      ]
    }
  };

  let stringifiedYaml = JSON.stringify(podYaml);




//WRITE A NEW POD YAML FILE
fs.writeFile(
  __dirname + `/yamlAssets/pods/${data.podName}.json`,
  stringifiedYaml,
  function(err) {
    if (err) {
      return console.log(err);
    }
    console.log("You made a pod Yaml!!!!");
  }
);


//CREATE POD AND INSERT INTO MINIKUBE
const child = spawn("kubectl", [
  "apply",
  "-f",
  __dirname + `/yamlAssets/pods/${data.podName}.json`
]);
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

  //SERVICE YAML TEMPLATE
  const serviceYaml = {
    apiVersion: "v1",
    kind: "Service",
    metadata: {
      name: `${data.name}`
    },
    spec: {
      selector: {
        app: `${data.appName}`
      },
      ports: [
        {
          protocol: "TCP",
          port: `${data.port}`,
          targetPort: `${data.targetPort}`
        }
      ]
    }
  }
    

  let stringifiedYaml = JSON.stringify(serviceYaml);

  //WRITE A NEW SERVICE YAML FILE
  fs.writeFile(
    __dirname + `/yamlAssets/services/${data.serviceName}.json`,
    stringifiedYaml,
    function(err) {
      if (err) {
        return console.log(err);
      }
      console.log("You made a service Yaml!!!!");
    }
  );


//CREATE SERVICE AND INSERT INTO MINIKUBE
  const child = spawn("kubectl", [
    "create",
    "-f",
    __dirname + `/yamlAssets/services/${data.serviceName}.json`
  ]);
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

  //DEPLOYMENT YAML TEMPLATE
  const deploymentYaml = {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name: `${data.deploymentName}`,
      labels: {
        app: `${data.appName}`
      }
    },
    spec: {
      replicas: `${data.replicas}`,
      selector: {
        matchLabels: {
          app: `${data.appName}`
        }
      },
      template: {
        metadata: {
          labels: {
            app: `${data.appName}`
          }
        },
        spec: {
          containers: [
            {
              name: `${data.containerName}`,
              image: `${data.image}`,
              ports: [
                {
                  containerPort: `${data.containerPort}`
                }
              ]
            }
          ]
        }
      }
    }
  };

  let stringifiedYaml = JSON.stringify(deploymentYaml);

  //WRITE A NEW DEPLOYENT YAML FILE
  fs.writeFile(
    __dirname + `/yamlAssets/deployments/${data.deploymentName}.json`,
    stringifiedYaml,
    function(err) {
      if (err) {
        return console.log(err);
      }
      console.log("You made a deployment Yaml!!!!");
    }
  );


//CREATE DEPLOYMENT AND INSERT INTO MINIKUBE
  const child = spawn("kubectl", [
    "create",
    "-f",
    __dirname + `/yamlAssets/deployments/${data.deploymentName}.json`
  ]);
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
app.on('ready', createWindow);

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

