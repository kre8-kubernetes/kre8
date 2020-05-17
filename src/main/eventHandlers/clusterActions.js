const fsp = require('fs').promises;
const { spawnSync } = require('child_process');

const {
  createPodYamlTemplate,
  createServiceYamlTemplate,
  createDeploymentYamlTemplate,
} = require('../helperFunctions/kubernetesTemplates');

const events = require('../../eventTypes.js');

const { logWithLabel, logLabeledError } = require('../utils');

const { timeout } = require('../utils/async');

/**
 * Check credentials file to determine if user needs to configure the application
 * If credential's file hasn't been created yet (meaning user hasn't entered credentials
 * previously), serve HomeComponent page, otherwise serve HomeComponentPostCredentials.
 * This will excute when the application is opened
 * @param {Object} event
 * @return {Object} - object containing information from masterFile
*/
const getClusterDataHandler = async (event) => {
  try {
    const dataFromCredentialsFile = await fsp.readFile(
      `${process.env.AWS_STORAGE}AWS_Private/awsCredentials.json`,
      'utf-8',
    );

    const parsedCredentialsFileData = JSON.parse(dataFromCredentialsFile);
    const { clusterName } = parsedCredentialsFileData;

    const dataFromMasterFile = await fsp.readFile(
      `${process.env.AWS_STORAGE}AWS_Private/${clusterName}_MASTER_FILE.json`,
      'utf-8',
    );
    const parsedAWSMasterFileData = JSON.parse(dataFromMasterFile);
    delete parsedAWSMasterFileData.certificateAuthorityData;
    // Send cluster data to render thread to generate graph
    event.sender.send(events.SEND_CLUSTER_DATA, parsedAWSMasterFileData);
  } catch (err) {
    logLabeledError('GET_CLUSTER_DATA', err);
  }
};


/**
 * The following run 'kubectl get [component] -o=json' to get the services, one element in the
 * item array will contain the apiserver. result.items[x].metadata.labels.component = 'apiserver'
 * @param {Object} event
 * @param {String} data
 * @return {Object} - apiserver information from kubernetes api
*/
const getMasterNodeHandler = async (event) => {
  try {
    // command kubctl to get service data
    const apiServiceData = spawnSync('kubectl', ['get', 'svc', '-o=json'], { env: process.env });
    // string the data and log to the console;
    const stdout = apiServiceData.stdout.toString();
    const stdoutParsed = JSON.parse(stdout);
    const stderr = apiServiceData.stderr.toString();

    if (stderr) throw stderr;
    const clusterApiData = stdoutParsed.items.find((item) => {
      if (item.metadata.labels) {
        return item.metadata.labels.component === 'apiserver';
      }
    });
    // return service data to the render thread
    event.sender.send(events.HANDLE_MASTER_NODE, clusterApiData);
  } catch (err) {
    logLabeledError(events.GET_MASTER_NODE, err);
    event.sender.send(events.HANDLE_MASTER_NODE, err);
  }
};

const getWorkerNodesHandler = async (event) => {
  try {
    const apiNodeData = spawnSync('kubectl', ['get', 'nodes', '-o=json'], { env: process.env });
    const stdout = apiNodeData.stdout.toString();
    const stdoutParsed = JSON.parse(stdout);
    const stderr = apiNodeData.stderr.toString();

    if (stderr) throw stderr;
    // return worker node data to the render thread
    event.sender.send(events.HANDLE_WORKER_NODES, stdoutParsed);
  } catch (err) {
    logLabeledError(events.GET_WORKER_NODES, err);
    // send error message to the render thread to display
    event.sender.send(events.HANDLE_WORKER_NODES, err);
  }
};

const getContainersAndPodsHandler = async (event) => {
  try {
    const apiNodeData = spawnSync('kubectl', ['get', 'pods', '-o=json'], { env: process.env });
    const stdout = apiNodeData.stdout.toString();
    const stdoutParsed = JSON.parse(stdout);

    const stderr = apiNodeData.stderr.toString();
    if (stderr) throw stderr;
    // return pod data to the render thread
    event.sender.send(events.HANDLE_CONTAINERS_AND_PODS, stdoutParsed);
  } catch (err) {
    logLabeledError(events.GET_CONTAINERS_AND_PODS, err);
    // return error message to the render thread to display
    event.sender.send(events.HANDLE_CONTAINERS_AND_PODS, err);
  }
};

/**
 * The following functions pass user input into a function a that creates a json object
 * based on a template. The new .json file is used to apply to kubectl in order to create
 * the appropriate kubernetes deployment
 * @param {Object} event
 * @param {Object} data - this is an object from the users form inputs
 * @return {String} - stdout from kubectl
*/
const createPodHandler = async (event, data) => {
  try {
    // CREATE AND WRITE A POD FILE FROM TEMPLATE
    const podYamlTemplate = createPodYamlTemplate(data);
    const stringifiedPodYamlTemplate = JSON.stringify(podYamlTemplate, null, 2);
    await fsp.writeFile(
      `${process.env.KUBECTL_STORAGE}pod_${data.podName}.json`,
      stringifiedPodYamlTemplate,
    );
    // CREATE THE POD VIA kubectl
    const child = spawnSync(
      'kubectl',
      ['apply', '-f', `${process.env.KUBECTL_STORAGE}pod_${data.podName}.json`],
      { env: process.env },
    );
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();

    await timeout(1000 * 5);
    // SEND STDOUT TO RENDERER PROCESS
    if (stderr) {
      logLabeledError(events.CREATE_POD, stderr);
      event.sender.send(events.HANDLE_NEW_POD, stdout);
    } else {
      logWithLabel('stdout from pod', stdout);
      event.sender.send(events.HANDLE_NEW_POD, stdout);
      event.sender.send(events.HANDLE_RERENDER_NODE, 'handle rerender node for create deployment');
    }
  } catch (err) {
    logLabeledError(events.CREATE_POD, err);
  }
};

const createServiceHandler = async (event, data) => {
  try {
    logWithLabel(events.CREATE_SERVICE, data);
    // CREATE AND WRITE THE SERVICE FILE FROM TEMPLATE
    const serviceYamlTemplate = createServiceYamlTemplate(data);
    const stringifiedServiceYamlTemplate = JSON.stringify(serviceYamlTemplate, null, 2);
    await fsp.writeFile(
      `${process.env.KUBECTL_STORAGE}service_${data.serviceName}.json`,
      stringifiedServiceYamlTemplate,
    );
    // CREATE THE SERVICE VIA kubectl
    const child = spawnSync(
      'kubectl',
      ['apply', '-f', `${process.env.KUBECTL_STORAGE}service_${data.serviceName}.json`],
      { env: process.env },
    );
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();
    // SEND STATUS TO THE RENDERER PROCESS
    if (stderr) {
      logLabeledError(events.CREATE_SERVICE, stderr);
      event.sender.send(events.HANDLE_NEW_SERVICE, stdout);
    } else {
      logWithLabel('stdout from deployment: ', stdout);
      event.sender.send(events.HANDLE_NEW_SERVICE, stdout);
      event.sender.send(events.HANDLE_RERENDER_NODE, 'handle rerender node for create service');
    }
  } catch (err) {
    logLabeledError(events.CREATE_SERVICE, err);
  }
};

const createDeploymentHandler = async (event, data) => {
  try {
    // START CREATING DEPLOYMENT
    if (data.replicas > 6) {
      throw new Error(`Replica amount entered was ${data.replicas}. This value has to be 6 or less.`);
    }
    // CREATE AND WRITE THE DEPLOYMENT FILE FROM TEMPLATE
    const deploymentYamlTemplate = createDeploymentYamlTemplate(data);
    const stringifiedDeploymentYamlTemplate = JSON.stringify(deploymentYamlTemplate, null, 2);
    await fsp.writeFile(
      `${process.env.KUBECTL_STORAGE}deployment_${data.deploymentName}.json`,
      stringifiedDeploymentYamlTemplate,
    );
    // CREATE THE DEPOYMENT VIA kubectl
    const child = spawnSync(
      'kubectl',
      ['create', '-f', `${process.env.KUBECTL_STORAGE}deployment_${data.deploymentName}.json`],
      { env: process.env },
    );
    const stdout = child.stdout.toString();
    const stderr = child.stderr.toString();

    await timeout(1000 * 30);
    // SEND STATUS TO THE RENDERER PROCESS
    if (stderr) {
      logLabeledError(events.CREATE_DEPLOYMENT, stderr);
      event.sender.send(events.HANDLE_NEW_DEPLOYMENT, stderr);
    } else {
      logWithLabel('stdout from deployment: ', stdout);
      event.sender.send(events.HANDLE_NEW_DEPLOYMENT, stdout);
      event.sender.send(events.HANDLE_RERENDER_NODE, 'handle rerender node for create deployment');
    }
  } catch (err) {
    logLabeledError(events.CREATE_DEPLOYMENT, err);
  }
};


/** ----------------- DELETE A DEPLOYMENT -------------------------
 * @param {Object} event
 * @param {Object} data - object containing the information regarding the pod
 * the was clicked. This is used to determine the deployment to delete
 * @return {String} - stdout from kubectl
*/
const deleteDeploymentHandler = async (event, data) => {
  try {
    // DELETE THE POD VIA kubectl
    const split = data.data.name.split('-');
    const deploymentName = split.slice(0, split.length - 2).join('-');
    const child = spawnSync(
      'kubectl',
      ['delete', 'deployment', deploymentName],
      { env: process.env },
    );
    const stderr = child.stderr.toString();

    if (stderr) throw new Error(stderr);
    // WAIT 10 SECONDS TO ALLOW DEPLOYMENT DELETION TO COMPLETE
    await timeout(1000 * 10);
    // SEND STDOUT TO RENDERER PROCESS
    event.sender.send(events.HANDLE_RERENDER_NODE, 'delete');
  } catch (err) {
    logLabeledError(events.DELETE_DEPLOYMENT, err);
  }
}

module.exports = {
  getClusterDataHandler,
  getMasterNodeHandler,
  getWorkerNodesHandler,
  getContainersAndPodsHandler,
  createPodHandler,
  createServiceHandler,
  createDeploymentHandler,
  deleteDeploymentHandler,
};
