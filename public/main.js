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
//const stackTemplateWorkerNode = require(__dirname + '/sdkAssets/samples/amazon-eks-worker-node-stack-template.json');
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


//** --------- GLOBAL VARIABLES FOR SDK
let iamRoleName = "Carolyn_Test"; 
let techStackName = "CarolynTestStack";
let clusterName;


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

  //Data from user input + imported policy document
  //const roleName = data.roleName;
  iamRoleName = data.roleName;
  const roleDescription = data.description;
  const iamRolePolicyDoc = iamRolePolicyDocument;

  const iamRoleCreated = awsEventCallbacks.createIAMRoleAndCreateFileAndAttachPolicyDocs(roleName, roleDescription, iamRolePolicyDoc);

  //TODO decide what to return to the the user

  win.webContents.send(events.HANDLE_NEW_ROLE, iamRoleCreated);
})

//** ------ CREATE AWS TECH STACK + SAVE RETURNED DATA IN FILE ---- **//
//Takes approx 1 - 1.5 mins to create stack and get data back from AWS
ipcMain.on(events.CREATE_TECH_STACK, async (event, data) => {

  try {
    const stackTemplateStringified = JSON.stringify(stackTemplate);
    const techStackName = data.stackName;

    console.log("iamRoleName: ", iamRoleName);
    console.log("techStackName: ", techStackName)

    const createdStack = await awsEventCallbacks.createTechStackAndSaveReturnedDataInFile(techStackName, stackTemplateStringified);

  } catch (err) {
    console.log(err);
  }

  //TODO decide what to send back to user. Now juse sends stackName
  win.webContents.send(events.HANDLE_NEW_TECH_STACK, createdStack);
})

//** --------- CREATE AWS CLUSTER ---------------------------------- **//
ipcMain.on(events.CREATE_CLUSTER, async (event, data) => {

  //Collect form data, input by the user when creating a Cluster, and insert into clusterParams object

  //TODO, do not hardcode stackName or RoleArn
  //const techStackName = 'carolyn-testing-stack';
  techStackName = "CarolynTestStack";
  //iamRoleName = "Carolyn_Test"; 
  //roleArn = 'arn:aws:iam::961616458351:role/carolyn-testing';
  //const clusterName = data.clusterName;
  clusterName = data.clusterName;

  try {
    const createdCluster = await awsEventCallbacks.createClusterAndSaveReturnedDataToFile(techStackName, iamRoleName, clusterName);
  } catch (err) {
    console.log(err);
  }

  win.webContents.send(events.HANDLE_NEW_CLUSTER, clusterName);
});


//TODO No button should be used, should auto happen after last thing completes

ipcMain.on(events.CONFIG_KUBECTL_AND_MAKE_NODES, async (event, data) => {

  clusterName = "CarolynTestCluster";
  stackName = "CarolynTestStack";
  const subnetIds = [
    "subnet-0051b552b152c8fd0",
    "subnet-0a655b2ae656eaad0",
    "subnet-056cddf44abbbf218"
  ];

  try {

    await kubectlConfigFunctions.createConfigFile(clusterName);
    await kubectlConfigFunctions.configureKubectl(clusterName);
    await kubectlConfigFunctions.createStackForWorkerNode(clusterName, subnetIds);
    await kubectlConfigFunctions.inputNodeInstance(stackName, clusterName);
  } catch (err) {
    console.log(err);
  }

  win.webContents.send(events.HANDLE_NEW_NODES, 'Nodes were made from the main thread')
})


//** ----------KUBECTL EVENTS WILL GO HERE ------------------------- **//

// KUBECTL EVENTS - CREATE POD (EXAMPLE)
// ipcMain.on(events.CREATE_POD, (event, data) => {
//   // TEST data should be 'CREATE_ROLE';
//   console.log('data from create a pod', data)
//   // Perform logic to create the POD

//   // Once role is created then we need to indicate back to the renderer process
//   // that the role is made
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

//   //WRITE A NEW POD YAML FILE
//   fs.writeFileSync(__dirname + `/yamlAssets/pods/${data.podName}.json`, stringifiedYaml);
//   // fs.writeFile(
//   //   __dirname + `./yamlAssets/pods/${data.podName}.json`,
//   //   stringifiedYaml,
//   //   function(err) {
//   //     if (err) {
//   //       return console.log(err);
//   //     }
//   //     console.log("You made a pod Yaml!!!!");
//   //   }
//   // );

//   console.log("I made a Pod Yaml file!");

//   const podYamlFile = fs.readFileSync(__dirname + `/yamlAssets/pods/${data.podName}.json`);

//   //CREATE POD AND INSERT INTO AWS
//   const child = spawn("kubectl", [
//     "apply",
//     "-f",
//     podYamlFile
//   ]);
//   console.log("podCreator");
//   child.stdout.on("data", data => {
//     console.log(`stdout: ${data}`);
//   });
//   child.stderr.on("data", data => {
//     console.log(`stderr: ${data}`);
//   });
//   child.on("close", code => {
//     console.log(`child process exited with code ${code}`);
//   });
// });

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


// const role = await iam.createRole(iamParams)
  
//   , (err, data) => {
//     if (err) console.log(err);
//     else { 
//       //Collect the relevant IAM data returned from AWS and store in an object to stringify*/
//       const iamRoleDataFromForm = {
//         roleName: data.Role.RoleName,
//         createDate: data.Role.RoleId,
//         roleID: data.Role.RoleId,
//         arn: data.Role.Arn,
//         createDate: data.Role.CreateDate,
//         path: data.Role.Path, 
//       }

//       let stringifiedIamRoleDataFromForm = JSON.stringify(iamRoleDataFromForm);

//       //Create a file from returned data with the title of the role name that the user selected and save in assets folder */
//       fs.writeFile(__dirname + `/sdkAssets/private/${roleName}.json`, stringifiedIamRoleDataFromForm, (err) => {
//         if (err) console.log(err); 
//         else {
//           console.log("file created");
//         }   
//       }); 
//     };         
//   }) 

//   // Once role is created send back to renderer that the role is made
//   win.webContents.send(events.HANDLE_NEW_ROLE, roleName);
// })