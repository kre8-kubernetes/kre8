//** --------- NODE APIS ---------------- 
const fs = require('fs');
const fsp = require('fs').promises;
// const { spawn } = require('child_process');
// const path = require('path');

// //** --------- IMPORT AWS SDK ELEMENTS ----- 
// const EKS = require('aws-sdk/clients/eks');
// const IAM = require('aws-sdk/clients/iam');
// const CloudFormation = require('aws-sdk/clients/cloudformation');

// //** --------- INITIALIZE SDK IMPORTS ------ 
// const iam = new IAM()
// const eks = new EKS({ region: process.env.REGION});
// const cloudformation = new CloudFormation({ region: process.env.REGION});

//** --------- IMPORT MODULES -----------------
//const awsParameters = require(__dirname + '/awsParameters');

//** --------- DECLARE EXPORT OBJECT ---------------------------------- 

const awsHelperFunctions = {};

//** -- Timeout Function blocks excution thread for ms Miliseconds ------ 
awsHelperFunctions.timeout = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
} 

//** -- Function to check the Filesystem for a specific directory --- 
awsHelperFunctions.checkFileSystemForDirectoryAndMkDir = async (folderName) => {
  try {
    const fileExists = fs.existsSync(process.env['HOME'] + `/${folderName}`);
    if (!fileExists) await fsp.mkdir(process.env['HOME'] + `/${folderName}`);
  } catch (err) {
    console.log(err);
  }
}

//** --------- READ & CHECK AWS_MASTER FILE --------------- **//
//Checks if the master file exists and if it does not, creates it
/**
// @param {string} key keyname of the object property in question
// @param {string} value the value of the property in question
*/
awsHelperFunctions.checkAWSMasterFile = async (key, value) => {

  let valueToReturn;

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('=============  awsHelperFunctions.checkAWSMasterFile ================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    const fileExists = fs.existsSync(process.env['AWS_STORAGE'] + `AWS_Private/${process.env['IAM_ROLE_NAME']}_MASTER_FILE.json`);

    if (fileExists) {

      //TODO CAHNGE I AM ROLE TO CLUSTER NAME
      const awsMasterFileContents = await fsp.readFile(process.env['AWS_STORAGE'] + `AWS_Private/${process.env['IAM_ROLE_NAME']}_MASTER_FILE.json`, 'utf-8');
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

      const dataForAWSMasterDataFile = {};
      const stringifiedDataForAWSMasterDataFile = JSON.stringify(dataForAWSMasterDataFile, null, 2);

      const awsMasterFile = await fsp.writeFile(process.env['AWS_STORAGE'] + `AWS_Private/${process.env['IAM_ROLE_NAME']}_MASTER_FILE.json`, stringifiedDataForAWSMasterDataFile);

      console.log("file did not exist. Created file and wrote initial data to file: ", stringifiedDataForAWSMasterDataFile);

      valueToReturn = false;
    }

    console.log("valueToReturn: ", valueToReturn);
    return valueToReturn;
    
  } catch (err) {
    console.log('Error from awsHelperFunctions.checkAWSMasterFile:', err);
  }


}

//** --------- APPEND AWS_MASTER FILE ------------------------------- **//
//Check if data is in AWS_MASTER_FILE yet, if not, add it
awsHelperFunctions.appendAWSMasterFile = async (awsDataObject) => {

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('============= awsHelperFunctions.appendAWSMasterFile ================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    console.log("Data to append to file", awsDataObject);
    
    const awsMasterFileContents = await fsp.readFile(process.env['AWS_STORAGE'] + `AWS_Private/${process.env['IAM_ROLE_NAME']}_MASTER_FILE.json`, 'utf-8');
    const parsedAWSMasterFileContents = JSON.parse(awsMasterFileContents);

    Object.entries(awsDataObject).forEach(value => {
      parsedAWSMasterFileContents[value[0]] = value[1];
    })

    const stringifiedAWSMasterFileContents = JSON.stringify(parsedAWSMasterFileContents, null, 2);
    
    await fsp.writeFile(process.env['AWS_STORAGE'] + `AWS_Private/${process.env['IAM_ROLE_NAME']}_MASTER_FILE.json`, stringifiedAWSMasterFileContents);

    console.log("data was added to the master file: ", stringifiedAWSMasterFileContents);

    return parsedAWSMasterFileContents;

  } catch (err) {
    console.log('Error from awsHelperFunctions.appendAWSMaster File: ', err);
  }
}

module.exports = awsHelperFunctions;
