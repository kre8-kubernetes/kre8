const {
  ERROR,
} = require('../awsPropertyNames');

const clusterInitError = (type, segement, err) => ({
  type,
  status: ERROR,
  errorMessage: `Error occurred while creating ${segement}: ${err}`,
});

module.exports = {
  clusterInitError,
};
