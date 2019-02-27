const fs = require('fs');
const { spawn, spawnSync } = require('child_process');
const fsp = require('fs').promises;
const path = require('path');

const onDownload = {}

//** --------- INSTALL AWS IAM AUTHENTICATOR FOR EKS ---------------------- **//
onDownload.installIAMAuthenticator = () => {
  console.log('now installing IAM authenticator');

  const child = spawnSync('curl', ['-o', 'aws-iam-authenticator', 'https://amazon-eks.s3-us-west-2.amazonaws.com/1.11.5/2018-12-06/bin/darwin/amd64/aws-iam-authenticator']);
  
  const stdout = child.stdout.toString();
  const stderr = child.stderr.toString();

  console.log('stdout', stdout, 'stderr', stderr);

}

//** --------- APPLY PERMISSIONS TO BINARY FILE TO MAKE EXECUTABLE -------- **//
onDownload.enableIAMAuthenticator = () => {
  console.log('now enabling IAM authenticator');

  const child = spawnSync('chmod', ['+x', './aws-iam-authenticator']);
  const stdout = child.stdout.toString();
  const stderr = child.stderr.toString();

  console.log('stdout', stdout, 'stderr', stderr);

}

//** ---- COPY AWS-IAM-AUTHENTICATOR TO BIN FOLDER IN HOME DIRECTORY ------ **//
onDownload.copyIAMAuthenticatorToBinFolder = () => {
  console.log('now copying to bin folder');

  //Check if user has bin folder in Home directory, if not, create one
  const binFolderExists = fs.existsSync(process.env['HOME'] + '/bin');

  if (!binFolderExists) {
    fs.mkdirSync(process.env['HOME'] + '/bin'), (err) => {
      if (err) console.log("mkdir error", "err");
    }
  }
    
  //Copy the aws-iam-authenticator into the bin folder
  const child = spawnSync('cp', ['./aws-iam-authenticator', process.env['HOME'] + '/bin/aws-iam-authenticator']);
  const stdout = child.stdout.toString();
  const stderr = child.stderr.toString();
  console.log('stdout', stdout, 'stderr', stderr);
 
}

//** ---- SET PATH ENVIRONTMENT VARIABLE & APPEND TO BASH_PROFILE FILE --- **//
//Function checks if the user has a .bash_profile file in their home directory, 
//if so, it checks to see if it explicitly sets the PATH variable to point to the bin folder  
//if not, it appends this to the profile
//if no .bash_profile exists, it creates one with this text included
onDownload.setPATHAndAppendToBashProfile = async () => {
  console.log('now appending path to bash profile');

  try {

    const textToInsert = `\nexport PATH=$HOME/bin:$PATH`;

    //check if bash profile exists in user's home directory

    const bashProfileExists = fs.existsSync(process.env['HOME'] +'/.bash_profile');
    console.log('bashProfileExists:', bashProfileExists)

    if (bashProfileExists) {
      console.log("profile exists");

      const textToCheckForinBashProfile = 'export PATH=$HOME/bin:$PATH';

      let bashProfileContents = await fsp.readFile(process.env['HOME'] + '/.bash_profile', 'utf-8')
    
      const bashProfileIncludesText = bashProfileContents.includes(textToCheckForinBashProfile);

      if (!bashProfileIncludesText) {
        console.log("Bash profile did not include text, adding it to profile");
        await fsp.appendFile(process.env['HOME'] + '/.bash_profile', textToInsert) 
      } else {
        console.log ("bash profile already included the text")
      }
    } else {
      console.log('profile didnt exist', textToInsert)
      await fsp.writeFile(process.env['HOME'] +'/.bash_profile', textToInsert)
    }

  } catch (err) {
    console.log(err);
  }
}



module.exports = onDownload;