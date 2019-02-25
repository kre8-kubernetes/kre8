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

awsHelperFunctions.returnAWSCredentials = async () => {
  try{
    const awsConfigData = {};
    const fileExists = fs.existsSync(__dirname + `/../sdkAssets/private/AWS_CONFIG_DATA.json`);

    if (fileExists) {
      const awsConfigFileData = await fsp.readFile(__dirname + `/../sdkAssets/private/AWS_CONFIG_DATA.json`, 'utf-8');
      const parsedAWSConfigFileData = JSON.parse(awsConfigFileData);
      console.log("Config file exits and here are the contents:", parsedAWSConfigFileData);
      awsConfigData.accessKeyId = parsedAWSConfigFileData.awsAccessKeyId;
      awsConfigData.secretAccessKey = parsedAWSConfigFileData.secretAccessKey;
      awsConfigData.region = parsedAWSConfigFileData.awsRegion;
    } else {
      //TODO unknown if we need
      //awsConfigData.region = REGION;
    }
    console.log("awsConfigData: ", awsConfigData)
    return awsConfigData;

  } catch (err) {
    console.log(err)
  }
}


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

/** -- Function to read and check AWS_MASTER file ---
 * This is a function that will check if the master file exists and if it does,
 * then we will create that
* @param {string} key keyname of the object property in question
* @param {string} value the value of the property in question
**/ 
awsHelperFunctions.checkAWSMasterFile = async (key, value) => {

  let valueToReturn;

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('=============  awsHelperFunctions.checkAWSMasterFile ================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    const fileExists = fs.existsSync(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`);

    if (fileExists) {
      const awsMasterFileContents = await fsp.readFile(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`, 'utf-8');
      const parsedAWSMasterFileContents = JSON.parse(awsMasterFileContents);
      console.log("Master file exits and here are the contents:", parsedAWSMasterFileContents);

      if (parsedAWSMasterFileContents[key] === value) {
        console.log("key already exists in the parsed master file")
        valueToReturn = true;
      } else {
        console.log("key did not exist in the parsed master file")
        valueToReturn = false;
      }
    } else {
      const dataForAWSMasterDataFile = { [key]: value };
      const stringifiedDataForAWSMasterDataFile = JSON.stringify(dataForAWSMasterDataFile, null, 2);
      const awsMasterFile = await fsp.writeFile(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`, stringifiedDataForAWSMasterDataFile);

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
awsHelperFunctions.appendAWSMasterFile = async (data) => {

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('============= awsHelperFunctions.appendAWSMasterFile ================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    console.log("Data to append to file", typeof data, data);
    
    const awsMasterFileContents = await fsp.readFile(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`, 'utf-8');

    const parsedAWSMasterFileContents = JSON.parse(awsMasterFileContents);

    for (let key in data) {
      parsedAWSMasterFileContents[key] = data[key];
    }

    const stringifiedAWSMasterFileContents = JSON.stringify(parsedAWSMasterFileContents, null, 2);
    
    await fsp.writeFile(__dirname + `/../sdkAssets/private/AWS_MASTER_DATA.json`, stringifiedAWSMasterFileContents);

    console.log("Data was added to the master file");

    return parsedAWSMasterFileContents;

  } catch (err) {
    console.log('Error from awsHelperFunctions.appendAWSMaster File: ', err);
  }
}

module.exports = awsHelperFunctions;
