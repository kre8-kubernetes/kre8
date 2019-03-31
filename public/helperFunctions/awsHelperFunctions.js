//* --------- NODE APIS ----------------
const fs = require('fs');
const fsp = require('fs').promises;

//* --------- IMPORT MODULES -----------------

//* --------- DECLARE EXPORT OBJECT ---------------------------------------- **//

const awsHelperFunctions = {};

//* --------- Timeout function blocks excution thread for ms Miliseconds --- **//
/**
 * timeout() returns a promise that will will resolve after a number of milliseconds
 * that are passed in as an argument
 * @param {Number} ms milliseconds
 * @return {Promise}
*/
awsHelperFunctions.timeout = ms => new Promise(resolve => setTimeout(resolve, ms));

//* --------- Check the Filesystem for a specific directory ----------------- **//
/**
 * Will make the desired folder from the user's root folder if it does not exist
 * @param {string} folderName name of folder of interest
 * @return {undefined}
*/
awsHelperFunctions.checkFileSystemForDirectoryAndMkDir = async (folderName) => {
  try {
    const fileExists = fs.existsSync(`${process.env.HOME}/${folderName}`);
    if (!fileExists) await fsp.mkdir(`${process.env.HOME}/${folderName}`);
  } catch (err) {
    console.error('From checkFileSystemForDirectoryAndMkDir', err);
    throw err;
  }
};

//* --------- UPDATE awsCredentials FILE ------------------------------------ **//
/**
 * updates the awsCredentials file to include the incoming property name and value
 * @param {string} key keyname of the object property in question
 * @param {string} value the value of the property in question
 * @return {undefined}
*/
awsHelperFunctions.updateCredentialsFile = async (key, value) => {
  try {
    const readCredentialsFile = await fsp.readFile(`${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`, 'utf-8');
    const parsedCredentialsFile = JSON.parse(readCredentialsFile);
    parsedCredentialsFile[key] = value;
    const stringifiedCredentialFile = JSON.stringify(parsedCredentialsFile, null, 2);
    fsp.writeFile(`${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`, stringifiedCredentialFile);
  } catch (err) {
    console.error('From updateCredentialsFile', err);
    throw err;
  }
};

//* --------- READ & CHECK AWS_MASTER FILE ---------------------------------- **//
/**
 * Checks if the master file exists and if it does not, creates it
 * checkMasterFile() will return false if file does not exist or if
 * the specific property does not match the property value argument
 * @param {string} key keyname of the object property in question
 * @param {string} value the value of the property in question
 * @return {Boolean}
*/
awsHelperFunctions.checkAWSMasterFile = async (key, value) => {
  try {
    let valueToReturn;
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log('=============  awsHelperFunctions.checkAWSMasterFile ================');
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    const fileExists = fs.existsSync(`${process.env.AWS_STORAGE}AWS_Private/${process.env.CLUSTER_NAME}_MASTER_FILE.json`);

    if (fileExists) {
      const awsMasterFileContents = await fsp.readFile(`${process.env.AWS_STORAGE}AWS_Private/${process.env.CLUSTER_NAME}_MASTER_FILE.json`, 'utf-8');
      const parsedAWSMasterFileContents = JSON.parse(awsMasterFileContents);
      console.log('Master file exits');

      if (parsedAWSMasterFileContents[key] === value) {
        console.log('key and value already exists in the parsed master file');
        valueToReturn = true;
      } else {
        console.log('key did not exist in the parsed master file');
        valueToReturn = false;
      }
    // If file does not exist yet (will only ocurr when adding the IAM role)
    } else {
      const dataForAWSMasterDataFile = {};
      const stringifiedDataForAWSMasterDataFile = JSON.stringify(dataForAWSMasterDataFile, null, 2);
      await fsp.writeFile(`${process.env.AWS_STORAGE}AWS_Private/${process.env.CLUSTER_NAME}_MASTER_FILE.json`, stringifiedDataForAWSMasterDataFile);
      console.log('file did not exist. Created file and wrote initial data to file: ', stringifiedDataForAWSMasterDataFile);
      valueToReturn = false;
    }
    console.log('valueToReturn: ', valueToReturn);
    return valueToReturn;
  } catch (err) {
    console.error('Error from awsHelperFunctions.checkAWSMasterFile:', err);
    throw err;
  }
};

//* --------- APPEND AWS_MASTER FILE ------------------------------- **//
/**
 * Check if data from the incoming object is in AWS_MASTER_FILE yet
 * add the object properties to the master file if they are not there
 * @param {Object} awsDataObject
 * @return {Object}
*/
awsHelperFunctions.appendAWSMasterFile = async (awsDataObject) => {
  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('============= awsHelperFunctions.appendAWSMasterFile ================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('Data to append to file', awsDataObject);
    const awsMasterFileContents = await fsp.readFile(`${process.env.AWS_STORAGE}AWS_Private/${process.env.CLUSTER_NAME}_MASTER_FILE.json`, 'utf-8');
    const parsedAWSMasterFileContents = JSON.parse(awsMasterFileContents);

    Object.entries(awsDataObject).forEach((value) => {
      parsedAWSMasterFileContents[value[0]] = value[1];
    });

    const stringifiedAWSMasterFileContents = JSON.stringify(parsedAWSMasterFileContents, null, 2);
    await fsp.writeFile(`${process.env.AWS_STORAGE}AWS_Private/${process.env.CLUSTER_NAME}_MASTER_FILE.json`, stringifiedAWSMasterFileContents);

    console.log('data was added to the master file: ', stringifiedAWSMasterFileContents);
    return parsedAWSMasterFileContents;
  } catch (err) {
    console.error('Error from awsHelperFunctions.appendAWSMaster File: ', err);
    throw err;
  }
};

module.exports = awsHelperFunctions;
