const fs = require('fs');
const { spawn } = require('child_process');
const fsp = require('fs').promises;

const path = require('path');

//** --------- .ENV Variables -------------- 
const REGION = process.env.REGION;

//** --------- IMPORT AWS SDK ELEMENTS --------- 
const EKS = require('aws-sdk/clients/eks');
const IAM = require('aws-sdk/clients/iam');
const CloudFormation = require('aws-sdk/clients/cloudformation');

//** --------- INITIALIZE SDK IMPORTS ------ 
const iam = new IAM()
const eks = new EKS({ region: REGION});
const cloudformation = new CloudFormation({ region: REGION});

//** --------- IMPORT LOCAL RESOURCES ------ 
const awsParameters = require(__dirname + '/awsParameters');

const awsHelperFunctions = {};


//** -- Timeout Function blocks excution thread for ms Miliseconds ------ 
awsHelperFunctions.timeout = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
} 


//** -- Function to check the Filesystem for a specific directory --- 

awsHelperFunctions.checkFileSystemForDirectoryAndMkDir = (folderName) => {
  const fileExists = fs.existsSync(process.env['HOME'] + `/${folderName}`);
  if (!fileExists) {
    fs.mkdirSync(process.env['HOME'] + `/${folderName}`), (err) => {
      if (err) console.log("mkdir error", folderName, err);
  };  
}
}

// try {

//   //Create a tech stack for worker node on AWS and save results to file in Assets Folder
//   const techStackCreated = await awsHelperFunctions.createTechStack(workerNodeStackName, techStackParam); 
//   } catch (err) {
//     console.log(err);
//   }

// const techStackCreated = await awsHelperFunctions.createTechStack(stackName, techStackParam); 


//** -- Function to Create a Tech Stack on AWS --- 
awsHelperFunctions.createTechStack = async (stackName, techStackParam) => {

  try {
    //Send tech stack data to AWS to create stack 
    const stack = await cloudformation.createStack(techStackParam).promise();

    const getStackDataParam = { StackName: stackName };

    let stringifiedStackData;
    let parsedStackData;
    let stackStatus = "CREATE_IN_PROGRESS";

    //TODO modularize function
    const getStackData = async () => {
      try {
        const stackData = await cloudformation.describeStacks(getStackDataParam).promise();
        stringifiedStackData = JSON.stringify(stackData.Stacks, null, 2);
        parsedStackData = JSON.parse(stringifiedStackData);
        stackStatus = parsedStackData[0].StackStatus;
      } catch (err) {
      }
    }
    
    //check with AWS to see if the stack has been created, if so, move on. If not, keep checking until complete. Estimated to take 1 - 1.5 mins.
    //TODO option includes "CREATE COMPLETE" if successful and "ROLLBACK_COMPLETE" if unsuccessflr
    while (stackStatus === "CREATE_IN_PROGRESS") {
      console.log("stackStatus in while loop: ", stackStatus);
      // wait 30 seconds before rerunning function
      await awsHelperFunctions.timeout(1000 * 30)
      getStackData();
    }

    if (stackStatus === "CREATE_COMPLETE") {
      const createStackFile = fsp.writeFile(__dirname + `/../sdkAssets/private/STACK_${stackName}.json`, stringifiedStackData);
    } else {
      console.log(`Error in creating stack. Stack Status = ${stackStatus}`)
    }

  } catch (err) {
    console.log(err);
  }

  //TODO Decide what to return to user
  return stackName;
}



module.exports = awsHelperFunctions;



// await new Promise((resolve, reject) => {
//   setTimeout(() => {
//     getStackData();
//     resolve();
//   }, 1000 * 1 * 60);
// })

// //TODO look into setInterval, and conside while loop. Reaname functoin
// await new Promise((resolve, reject) => {
//   const loop = () => {
//     if (stackStatus !== "CREATE_COMPLETE") {
//       setTimeout(() => {
//         getStackData();
//         loop();
//       }, 1000 * 30);
//     } else {
//       resolve();
//     }
//   }
//   loop();
// })



 // const subnetIds = 
    // parsedClusterFileContents.cluster.resourcesVpcConfig.subnetIds;
    // console.log("subnetIds: ", subnetIds)
    // const subnetIdsInCorrectFormat = subnetIds.reduce((acc, cv, index, array) => {
    //   if (index !== array.length -1) {
    //     acc += cv + ',';
    //   } else {
    //     acc += cv;
    //   }
    //   return acc;
    // }, '');
    // console.log("subnetIdsInCorrectFormat: ", subnetIdsInCorrectFormat);