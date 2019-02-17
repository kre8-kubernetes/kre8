const { electron, app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
require('dotenv').config();

const events = require('../eventTypes.js')
const awsHelperFunctions = require('./helperFunctions/awsHelperFunctions'); 

const fs = require('fs');
const { spawn } = require('child_process');
const fsp = require('fs').promises;

const YAML = require('yamljs');

//** --------- IMPORT SDK elements --------- 
const EKS = require('aws-sdk/clients/eks');
const IAM = require('aws-sdk/clients/iam');
const CloudFormation = require('aws-sdk/clients/cloudformation');

//** --------- IMPORT DOCUMENTS ------------ 
const iamRolePolicyDocument = require(__dirname + '/sdkAssets/samples/iamRoleTrustPolicy.json');
const stackTemplate = require(__dirname + '/sdkAssets/samples/amazon-stack-template-eks-vpc-real.json');
const stackTemplateWorkerNode = require(__dirname + '/sdkAssets/samples/amazon-eks-worker-node-stack-template.json');
const workerNodeJsonAuthFile = require(__dirname + '/sdkAssets/private/aws-auth-cm.json');

//**.ENV Variables */
const REGION = process.env.REGION;
const SERVICEROLEARN = process.env.EKSSERVICEROLEARN;

const SUBNETID1 = process.env.SUBNETID1;
const SUBNETID2 = process.env.SUBNETID2;
const SUBNETID3 = process.env.SUBNETID3;
const SUBNETIDS = [SUBNETID1, SUBNETID2, SUBNETID3];
const SECURITYGROUPIDS = process.env.SECURITYGROUPIDS;
const PORT = process.env.PORT;

//** --------- INITIALIZE IMPORTS --------- 
const iam = new IAM()
const eks = new EKS({ region: REGION});
const cloudformation = new CloudFormation({ region: REGION});

//** CREATE WINDOW OBJECT
let win;

//** Function to create our application window, that will be invoked with app.on('ready')
function createWindow () {
  win = new BrowserWindow({width: 1200, height: 800});

  win.loadURL(isDev ? `http://localhost:${PORT}` : `file://${path.join(__dirname, 'dist/index.html')}`)

  win.on('closed', () => win = null)
}

//** ----------------------------------------------------------------- **//
//** ----------------------- AWS SDK EVENTS -------------------------- **//
//** ----------------------------------------------------------------- **//


//** --------- INSTALL AWS IAM AUTHENTICATOR FOR EKS ----------------- **//
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

//** --------- CREATE AWS IAM ROLE + ATTACH POLICY DOCS --------------- **//
ipcMain.on(events.CREATE_IAM_ROLE, async (event, data) => {

  console.log("Iam role create fired");

  const roleName = data.roleName;
  const description = data.description;

  //Take user input when creating IAM Role & insert into the iamParams object
  const iamParams = {
    AssumeRolePolicyDocument: JSON.stringify(iamRolePolicyDocument),
    RoleName: roleName,
    Description: description,
    Path: '/', 
  };

  //Send IAM data to AWS via the iamParams object to create an IAM Role*/
  try {
    const role = await iam.createRole(iamParams).promise();
    //Collect the relevant IAM data returned from AWS and store in an object to stringify*/

    const iamRoleDataFromForm = {
      roleName: role.Role.RoleName,
      createDate: role.Role.RoleId,
      roleID: role.Role.RoleId,
      arn: role.Role.Arn,
      createDate: role.Role.CreateDate,
      path: role.Role.Path
    }

    const stringifiedIamRoleDataFromForm = JSON.stringify(iamRoleDataFromForm);
    
    //Create a file from returned data with the title of the role name that the user selected and save in assets folder */

    //TODO regular write file 
    fsp.writeFile(__dirname + `/sdkAssets/private/${roleName}.json`, stringifiedIamRoleDataFromForm);

    //Send Cluster + Service Policies to AWS to attach to created IAM Role 
    const clusterPolicyArn = 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy';
    const servicePolicyArn = 'arn:aws:iam::aws:policy/AmazonEKSServicePolicy';

    const clusterPolicy = {
      RoleName: roleName,
      PolicyArn: clusterPolicyArn
    }

    const servicePolicy = {
      RoleName: roleName,
      PolicyArn: servicePolicyArn
    }

    await iam.attachRolePolicy(clusterPolicy).promise();
    await iam.attachRolePolicy(servicePolicy).promise();

    //TODO: PROMISE ALL INSTEAD
  
  } catch (err) {
    console.log(err);
  }

  // Once role is created send back to renderer that the role is made
  win.webContents.send(events.HANDLE_NEW_ROLE, roleName);
})

//** --------- CREATE AWS TECH STACK + SAVE RETURNED DATA IN FILE ----- **//
//Takes approx 1 minute - 1 minute, 30 seconds to create stack and get data back from AWS
ipcMain.on(events.CREATE_TECH_STACK, async (event, data) => {

  console.log("fired");

// Stringify imported stackTemplate doc to insert into stackParams obj
const stackTemplateStringified = JSON.stringify(stackTemplate);
const stackName = data.stackName;

//Collect the form data, input by user when creating stack, insert into stackParams object
const stackParams = {
  StackName: stackName,
  DisableRollback: false,
  EnableTerminationProtection: false,
  Parameters: [
    { ParameterKey: 'VpcBlock', ParameterValue: '192.168.0.0/16', },
    { ParameterKey: 'Subnet01Block', ParameterValue: '192.168.64.0/18', },
    { ParameterKey: 'Subnet02Block', ParameterValue: '192.168.128.0/18', },
    { ParameterKey: 'Subnet03Block', ParameterValue: '192.168.192.0/18', }
  ],
  TemplateBody: stackTemplateStringified,
};

//Send Stack data to AWS via stackParams obj to create a Stack on AWS 
try {
  const stack = await cloudformation.createStack(stackParams).promise();

  const params = {
    StackName: stackName
  };

  let stringifiedStackData;
  let parsedStackData;
  let stackStatus = "CREATE_IN_PROGRESS";

  //TODO modularize functions
  const getStackData = async () => {
    try {
      const stackData = await cloudformation.describeStacks(params).promise();
      stringifiedStackData = JSON.stringify(stackData.Stacks, null, 2);
      parsedStackData = JSON.parse(stringifiedStackData);
      console.log(parsedStackData);
      stackStatus = parsedStackData[0].StackStatus;
      console.log("getting stack data status: ", stackStatus);
    } catch (err) {
      console.log("getStackDataFunction: ", err);
    }
  }
  
  //check with AWS to see if the stack has been created, if so, move on. If not, keep checking until complete. Estimated to take 1 - 1.5 mins.
  while (stackStatus !== "CREATE_COMPLETE") {
    console.log("stackStatus in while loop: ", stackStatus);
    // wait 30 seconds
    await awsHelperFunctions.timeout(1000 * 30)
    getStackData();
  }

  console.log("about to create file: ", stringifiedStackData)
  const createStackFile = fsp.writeFile(__dirname + `/sdkAssets/private/${stackName}.json`, stringifiedStackData);

  //Send a request to AWS to confirm stack creation and get data*/
  //const describleStack = await cloudformation.describeStacks(params).promise();

  //Stringify the data returned from AWS and save it in a file with the title of the stack name and save in the Assets folder
  // let stringifiedReturnedData = JSON.stringify(describleStack.Stacks);

  // fsp.writeFile(__dirname + `/sdkAssets/private/${stackName}.json`, stringifiedReturnedData);
} catch (err) {
  console.log(err);
}
})

//** --------- CREATE AWS CLUSTER ------------------------------------- **//
ipcMain.on(events.CREATE_CLUSTER, async (event, data) => {

  //Collect form data, input by the user when creating a Cluster, and insert into clusterParams object

  const clusterName = data.clusterName;

  //TODO: MAKE THESE VARIBLES DYNAMIC
    //READFILE

  //data saved in .env file
  const subnetIds = SUBNETIDS;
  const securityGroupIds = SECURITYGROUPIDS;
  const roleArn = SERVICEROLEARN;

  const clusterParams = {
    name: clusterName, 
    resourcesVpcConfig: {
      subnetIds: subnetIds,
      securityGroupIds: [
        securityGroupIds
      ]
    },
    roleArn: roleArn, 
  };

  try {
    //Send cluster data to AWS via clusterParmas to create a cluster */
    const cluster = await eks.createCluster(clusterParams).promise();
    
    const clusterParam = {
      name: clusterName
    };

    let parsedClusterData;
    let status = "CREATING";

    const getClusterData = async () => {
      const clusterData = await eks.describeCluster(clusterParam).promise();
      const stringifiedClusterData = JSON.stringify(clusterData, null, 2);
      parsedClusterData = JSON.parse(stringifiedClusterData);
      status = parsedClusterData.cluster.status;
    }

    await new Promise((resolve, reject) => {
      setTimeout(() => {
        getClusterData();
        resolve();
      }, 1000 * 60 * 6);
    })

    await new Promise((resolve, reject) => {
      const loop = () => {
        if (status !== "ACTIVE") {
          setTimeout(() => {
            getClusterData();
            loop();
          }, 1000 * 30);
        } else {
          resolve();
        }
      } 
      loop();  
    })
        
    const createClusterFile = await fsp.writeFile(__dirname + `/sdkAssets/private/${clusterName}.json`, stringifiedClusterData);


  } catch (err) {
    console.log("err", err);
  }
});

//TODO No button should be used, should auto happen after last thing completes



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