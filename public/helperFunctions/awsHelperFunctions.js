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

//** -- Function to check AWS_MASTER file --- 

awsHelperFunctions.checkAWSMasterFile = (key, value) => {
  const awsMasterFileContents = fs.readFileSync(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`, 'utf-8');

  const texttofind = `"${key}":"${value}"`

  console.log(texttofind);
  console.log(awsMasterFileContents);

  return awsMasterFileContents.includes(texttofind);
}

//if checkAWSMasterFile returns false, append text
awsHelperFunctions.appendAWSMasterFile = (data) => {

  const awsMasterFileContents = fs.readFileSync(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`, 'utf-8');

  const parsedAWSMasterFileContents = JSON.parse(awsMasterFileContents);

  console.log(parsedAWSMasterFileContents);

  const updatedFile = parsedAWSMasterFileContents.data;

  console.log(updatedFile);

  const appendMasterFile = fsp.appendFile(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`, data);

}












module.exports = awsHelperFunctions;


// try {

//   //Create a tech stack for worker node on AWS and save results to file in Assets Folder
//   const techStackCreated = await awsHelperFunctions.createTechStack(workerNodeStackName, techStackParam); 
//   } catch (err) {
//     console.log(err);
//   }

// const techStackCreated = await awsHelperFunctions.createTechStack(stackName, techStackParam); 




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