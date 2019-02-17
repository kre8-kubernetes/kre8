//TODO Functions to be executed within installaton OR at initial loading of app

//** --------- INSTALL AWS IAM AUTHENTICATOR FOR EKS --------------------------- **//
sdkController.installIAMAuthenticator = (req, res, next) => {
  
  const child = spawn('curl', ['-o', 'aws-iam-authenticator', 'https://amazon-eks.s3-us-west-2.amazonaws.com/1.11.5/2018-12-06/bin/darwin/amd64/aws-iam-authenticator']);
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
  
}

//TODO --need to add to kre8 file
//** --------- APPLY EXECUTE PERMISSIONS TO THE BINARY FILE -------------------- **//
sdkController.enableIAMAuthenticator = (req, res, next) => {
  
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
  
}

//TODO --need to add to kre8 file
//** ---- COPY AWS-IAM-AUTHENTICATOR FILE TO BIN FOLDER IN USER HOME DIRECTORY - **//
sdkController.copyToBinFolder = (req, res, next) => {
  //** Check if the user has a bin folder in their Home directory, if not, make one. */

  if (fs.existsSync(process.env['HOME'] + '/bin')) {
  } else {
    fs.mkdirSync(process.env['HOME'] + '/bin'), (err) => {
      if (err) console.log("mkdir error", "err");
    };  
  };

  //TODO --need to add to kre8 file
  //** Copy the AWS-iam-authenticator file into the bin folder. */
  const child = spawn('cp', ['./aws-iam-authenticator', process.env['HOME'] + '/bin/aws-iam-authenticator']);
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
}

//TODO --need to add to kre8 file
//** ---- APPEND PATH TO BASH_PROFILE FILE - **//
sdkController.appendToBashProfile = (req, res, next) => {

const textToInsert = `\nexport PATH=$HOME/bin:$PATH`;
fs.appendFile(process.env['HOME'] + '/.bash_profile', textToInsert, (err) => {
  if (err) console.log(err);
  else {
    console.log('Updated');
    //next();
  }
})

//TODO run source .bash_profile command
}