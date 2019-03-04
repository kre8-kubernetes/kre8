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


//** -- Function to generate AWS config object by reading file -------- 
//TODO: does this function talk to anything? IF not, delete!!!
// //Checks if AWS_CONFIG_FILE has been created
// //If so, reads the file
// awsHelperFunctions.returnAWSCredentials = async () => {
//   try{
//     const awsConfigData = {};
//     const fileExists = fs.existsSync(process.env['AWS_STORAGE'] + '/AWS_CONFIG_DATA.json');

//     if (fileExists) {
//       const awsConfigFileData = await fsp.readFile(process.env['AWS_STORAGE'] + '/AWS_CONFIG_DATA.json', 'utf-8');
//       const parsedAWSConfigFileData = JSON.parse(awsConfigFileData);
//       console.log("Config file exits and here are the contents:", parsedAWSConfigFileData);
//       awsConfigData.accessKeyId = parsedAWSConfigFileData.awsAccessKeyId;
//       awsConfigData.secretAccessKey = parsedAWSConfigFileData.secretAccessKey;
//       awsConfigData.region = parsedAWSConfigFileData.awsRegion;

//     } else {
//       //TODO unknown if we need
//       //awsConfigData.region = REGION;
//     }
//     console.log("awsConfigData: ", awsConfigData)
//     return awsConfigData;

//   } catch (err) {
//     console.log(err)
//   }
// }


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

//** --------- READ & CHECK AWS_MASTER FILE --------------- **//
//Checks if the master file exists and if it does not, create IT
// @param {string} key keyname of the object property in question
// @param {string} value the value of the property in question

awsHelperFunctions.checkAWSMasterFile = async (key, value) => {

  let valueToReturn;

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('=============  awsHelperFunctions.checkAWSMasterFile ================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    const fileExists = fs.existsSync(process.env['AWS_STORAGE'] + `${value}_MASTER_FILE.json`);

    if (fileExists) {

      //TODO: CREATE A FILE SPECIFIC TO THE IAM ROLE
      //TODO CAHNGE I AM ROLE TO CLUSTER NAME
      const awsMasterFileContents = await fsp.readFile(process.env['AWS_STORAGE'] + `${value}_MASTER_FILE.json`, 'utf-8');
      const parsedAWSMasterFileContents = JSON.parse(awsMasterFileContents);
      console.log("Master file exits and here are the contents:", parsedAWSMasterFileContents);

      if (parsedAWSMasterFileContents[key] === value) {
        console.log("key and value already exists in the parsed master file")
        valueToReturn = true;
      } else {
        console.log("key did not exist in the parsed master file")
        valueToReturn = false;
      }
    
    //If file does not exist yet (will only ocurr when adding the IAM role)
    } else {

      //TODO: maybe fix
      //const dataForAWSMasterDataFile = { [key]: value };
      const dataForAWSMasterDataFile = {};

      const stringifiedDataForAWSMasterDataFile = JSON.stringify(dataForAWSMasterDataFile, null, 2);

      const awsMasterFile = await fsp.writeFile(process.env['AWS_STORAGE'] + `${value}_MASTER_FILE.json`, stringifiedDataForAWSMasterDataFile);

      console.log("file did not exist. Created file and wrote initial data to file: ", stringifiedDataForAWSMasterDataFile);

      valueToReturn = false;
    }
    
  } catch (err) {
    console.log('Error from awsHelperFunctions.checkAWSMasterFile:', err);
  }

  console.log("valueToReturn: ", valueToReturn);
  return valueToReturn;
}

//if checkAWSMasterFile returns false, append text
awsHelperFunctions.appendAWSMasterFile = async (data, value) => {

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('============= awsHelperFunctions.appendAWSMasterFile ================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    console.log("Data to append to file", data);
    
    const awsMasterFileContents = await fsp.readFile(process.env['AWS_STORAGE'] + `${value}_MASTER_FILE.json`, 'utf-8');
    const parsedAWSMasterFileContents = JSON.parse(awsMasterFileContents);

    //TODO Reconfigure
    Object.entries(data).forEach(value => {
      parsedAWSMasterFileContents[value[0]] = value[1];
    })

    const stringifiedAWSMasterFileContents = JSON.stringify(parsedAWSMasterFileContents, null, 2);
    
    await fsp.writeFile(process.env['AWS_STORAGE'] + `${value}_MASTER_FILE.json`, stringifiedAWSMasterFileContents);

    console.log("Data was added to the master file: ", stringifiedAWSMasterFileContents);

    return parsedAWSMasterFileContents;

  } catch (err) {
    console.log('Error from awsHelperFunctions.appendAWSMaster File: ', err);
  }
}

module.exports = awsHelperFunctions;
