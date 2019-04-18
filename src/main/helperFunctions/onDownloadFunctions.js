// --------- NODE APIS ----------------
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const mkdirp = require('mkdirp');
const { spawnSync } = require('child_process');

// --------- DECLARE EXPORT OBJECT ----------------------------------
const onDownload = {};

/** --------- INSTALL AWS IAM AUTHENTICATOR FOR EKS ------------------
 * To communicate with AWS, user must have the aws-iam-authenticator installed.
 * This downloads it from an S3 bucket
 * @return {undefined}
*/
onDownload.installIAMAuthenticator = () => {
  console.log('now installing IAM authenticator');
  const target = `${process.env.HOME}/bin/aws-iam-authenticator`;
  mkdirp.sync(`${process.env.HOME}/bin`);
  const child = spawnSync('curl', ['-o', target, '--create-dirs', 'https://amazon-eks.s3-us-west-2.amazonaws.com/1.11.5/2018-12-06/bin/darwin/amd64/aws-iam-authenticator'], { shell: true });
  // const iamAuth = path.join(process.env.APP_PATH, '..', 'extraResources', 'aws-iam-authenticator');
  // console.log('AWS I AM PATH ====> ', iamAuth);
  // const child = spawnSync(iamAuth, []);
  // console.log('CHILD\n', child.toString());
  const stdout = child.stdout.toString();
  const stderr = child.stderr.toString();
  console.log('stdout', stdout, 'stderr', stderr);
};

/** --------- APPLY PERMISSIONS TO BINARY FILE TO MAKE EXECUTABLE -----
 * To make sure the file is executable, we chmod +x it
 * @return {undefined}
 */
onDownload.enableIAMAuthenticator = () => {
  console.log('now enabling IAM authenticator');
  // const iamAuth = path.join(process.env.APP_PATH, '..', 'extraResources', 'aws-iam-authenticator');
  const child = spawnSync('chmod', ['+x', `${process.env.HOME}/bin/aws-iam-authenticator`]);
  const stdout = child.stdout.toString();
  const stderr = child.stderr.toString();
  console.log('stdout', stdout, 'stderr', stderr);
};


/** ---- COPY AWS-IAM-AUTHENTICATOR TO BIN FOLDER IN HOME DIRECTORY -----
 * Checks if the user has a bin directory in their Home directory, if not one is created
 * and the aws-iam-authenticator is copied into the directory
 * @return {undefined}
 */
onDownload.copyIAMAuthenticatorToBinFolder = () => {
  const binFolderExists = fs.existsSync(`${process.env.HOME}/bin`);
  if (!binFolderExists) {
    fs.mkdirSync(`${process.env.HOME}/bin`);
  }
  const iamAuth = path.join(process.env.APP_PATH, '..', 'extraResources', 'aws-iam-authenticator');
  const child = spawnSync('mv', [iamAuth, `${process.env.HOME}/bin/aws-iam-authenticator`]);
  const stdout = child.stdout.toString();
  const stderr = child.stderr.toString();
  console.log('stdout', stdout, 'stderr', stderr);
};

/** ---- SET PATH ENVIRONTMENT VARIABLE & APPEND TO BASH_PROFILE FILE ---
 * Checks if user has .bash_profile file in home directory. If not, one is created.
 * If so, checks if .bash_profile contains text setting PATH to point to the bin folder.
 * If not, these instructions are appended to the file
 * @return {undefined}
 */
onDownload.setPATHAndAppendToBashProfile = async () => {
  try {
    console.log('now appending path to bash profile');
    const textToAppendToBashProfile = '\nexport PATH=$HOME/bin:$PATH';
    const bashProfileExists = fs.existsSync(`${process.env.HOME}/.bash_profile`);
    console.log('bashProfileExists:', bashProfileExists);

    if (bashProfileExists) {
      console.log('profile exists');
      const textToCheckForinBashProfile = 'export PATH=$HOME/bin:$PATH';
      const bashProfileContents = await fsp.readFile(`${process.env.HOME}/.bash_profile`, 'utf-8');
      const bashProfileIncludesText = bashProfileContents.includes(textToCheckForinBashProfile);

      if (!bashProfileIncludesText) {
        console.log('did not include text, adding it to profile');
        await fsp.appendFile(`${process.env.HOME}/.bash_profile`, textToAppendToBashProfile);
        process.env.PATH = `${process.env.HOME}/bin:${process.env.PATH}`;
      } else {
        console.log('bash profile already included the text');
      }
    } else {
      console.log('profile didnt exist', textToAppendToBashProfile);
      await fsp.writeFile(`${process.env.HOME}/.bash_profile`, textToAppendToBashProfile);
      process.env.PATH = `${process.env.HOME}/bin:${process.env.PATH}`;
    }
  } catch (err) {
    console.error('From setPATHAndAppendToBashProfile', err);
    throw err;
  }
};

module.exports = onDownload;
