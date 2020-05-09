const logWithLabel = (label, item) => {
  console.log(`${label} ==> ${item}`);
};

const logStep = (step) => {
  console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
  console.log(`============= ${step} ============`);
  console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
};

const logEvtError = (event, err) => {
  console.error(`ERROR from ${event}`, err);
};

const logError = (err) => console.error('Error : ', err);

const logLabeledError = (label, err) => {
  console.error(`ERROR from ${label} ::`, err);
};

module.exports = {
  logWithLabel,
  logStep,
  logEvtError,
  logError,
  logLabeledError,
};
