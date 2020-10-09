const events = require('../../eventTypes.js');

const { logLabeledError } = require('../utils');

const {
  returnKubectlAndCredentialsStatus,
} = require('../helperFunctions/awsEventCallbacks');

/**
 * Check credentials file to determine if user needs to configure the
 * application. This will execute on every opening of the application
 */
const checkCrendentialsStatusHandler = async (event) => {
  try {
    const hasAwsCredentials = await returnKubectlAndCredentialsStatus();
    event.sender.send(events.RETURN_CREDENTIAL_STATUS, hasAwsCredentials);
  } catch (err) {
    logLabeledError(events.CHECK_CREDENTIAL_STATUS, err);
    event.sender.send(
      events.RETURN_CREDENTIAL_STATUS,
      'Credentials have not yet been set, or there is an error with the file',
    );
  }
};

module.exports = {
  checkCrendentialsStatusHandler,
};
