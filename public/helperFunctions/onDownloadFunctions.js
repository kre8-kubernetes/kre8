const fs = require('fs');
const { spawn } = require('child_process');
const fsp = require('fs').promises;
const path = require('path');

const onDownload = {}

//** --------- INSTALL AWS IAM AUTHENTICATOR FOR EKS ---------------------- **//
onDownload.installIAMAuthenticator = async () => {

  //TODO: how to do node child process w await?
  try {

    const child = spawn('curl', ['-o', 'aws-iam-authenticator', 'https://amazon-eks.s3-us-west-2.amazonaws.com/1.11.5/2018-12-06/bin/darwin/amd64/aws-iam-authenticator']);

    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    })

    child.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    })

    child.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });

  } catch (err) {
    console.log(err)  
  }
}


//** --------- APPLY EXECUTE PERMISSIONS TO THE BINARY FILE ---------------- **//
onDownload.enableIAMAuthenticator = async () => {

  //TODO: add await
  try {
    const child = spawn('chmod', ['+x', './aws-iam-authenticator']);
      child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        
      })
      child.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
      })
      child.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        next();
      });

  } catch (err) {
    console.log(err);
  }
}

//** ---- COPY AWS-IAM-AUTHENTICATOR FILE TO BIN FOLDER IN HOME DIRECTORY - **//

 
onDownload.copyToBinFolder = async () => {

  //TODO: Should we use fsp?

  try {
    //Check if user has bin folder in Home directory, if not, make one.
    const doesBinFolderExist = fs.existsSync(process.env['HOME'] + '/bin');

    if (!doesBinFolderExist) {
      fs.mkdirSync(process.env['HOME'] + '/bin'), (err) => {
        if (err) console.log("mkdir error", "err");
      }
    }
    
    //Copy the AWS-iam-authenticator file into the bin folder. 
    const child = spawn('cp', ['./aws-iam-authenticator', process.env['HOME'] + '/bin/aws-iam-authenticator']);
      child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      })
      child.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
      })
      child.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
      });
  } catch (err) {
    console.log(err);
  }
}

//** ---- APPEND PATH TO BASH_PROFILE FILE - **//
onDownload.appendToBashProfile = async () => {

  try {
    const textToInsert = `\nexport PATH=$HOME/bin:$PATH`;

    fs.appendFile(process.env['HOME'] + '/.bash_profile', textToInsert, (err) => {
      if (err) console.log(err);
      else console.log('Updated');
    })
  } catch (err) {
    console.log(err);
  }
}



module.exports = onDownload;