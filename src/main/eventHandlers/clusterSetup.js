const events = require('../../eventTypes.js');

const { logWithLabel, logStep, logLabeledError } = require('../utils');

const { clusterInitError } = require('../utils/errors');

const { timeout } = require('../utils/async');

const {
  CREATED,
  CREATING,
  IAM_ROLE_STATUS,
  VPC_STACK_STATUS,
  CLUSTER_STATUS,
  WORKER_NODE_STATUS,
  KUBECTL_CONFIG_STATUS,
  CLUSTER_NAME,
} = require('../awsPropertyNames');

const {
  createIAMRole,
  createVPCStack,
  createCluster,
} = require('../helperFunctions/awsEventCallbacks');

const {
  updateCredentialsFile,
} = require('../helperFunctions/awsHelperFunctions');

const {
  createConfigFile,
  configureKubectl,
  createStackForWorkerNode,
  inputNodeInstance,
  testKubectlStatus,
} = require('../helperFunctions/kubectlConfigFunctions');

/**
 * createCluster() executes on the first interaction with the app when user submits data from
 * the AWS container from the renderer thread. The whole process will take approximately 10-15 minutes
 * This will create an IAM Role, a VPC stack, an EKS Cluster, and a Stack for EC2 worker nodes.
 * @param {Object} event
 * @param {Object} data - this is an object container role name, VPC name and cluster name
 * @return {Object} - this will continuously emit status object back to communicate with the renderer
 * thread, where in the process this function is at. Done to better inform user.
 */
const createClusterHandler = async (event, data) => {
  try {
    // Set CLUSTER_NAME environment variable based on user input and save to credentials file
    process.env.CLUSTER_NAME = data.clusterName;

    await updateCredentialsFile(CLUSTER_NAME, data.clusterName);

    // CREATE AWS IAM ROLE + ATTACH POLICY DOCS
    logStep('ipcMain.on(events.CREATE_IAM_ROLE)');

    // Send data to AWS to create IAM Role, timing: 10 - 30 seconds
    await createIAMRole(data.iamRoleName);

    // Send IAM Role status to render thread to display
    event.sender.send(events.HANDLE_STATUS_CHANGE, {
      type: IAM_ROLE_STATUS,
      status: CREATED,
    });

    // Send VPC Stack status to render thread to display
    event.sender.send(events.HANDLE_STATUS_CHANGE, {
      type: VPC_STACK_STATUS,
      status: CREATING,
    });
  } catch (err) {
    logLabeledError(events.CREATE_CLUSTER, err);
    // Send error status to render thread to display
    event.sender.send(
      events.HANDLE_ERRORS,
      clusterInitError(IAM_ROLE_STATUS, 'IAM Role', err),
    );
  }

  // CREATE AWS STACK (approx 1 - 1.5 mins)
  try {
    logStep('ipcMain.on(events.CREATE_TECH_STACK)');

    const { vpcStackName } = data;

    // Send data to AWS to create VPC Stack, timing: 30 seconds - 1 minute
    await createVPCStack(vpcStackName);

    logWithLabel(VPC_STACK_STATUS, CREATED);
    // Send VPC Stack status to render thread to display
    event.sender.send(events.HANDLE_STATUS_CHANGE, { status: CREATED });

    // Send Cluster status to render thread to display
    event.sender.send(events.HANDLE_STATUS_CHANGE, {
      type: CLUSTER_STATUS,
      status: CREATING,
    });
  } catch (err) {
    logLabeledError(VPC_STACK_STATUS, err);

    event.sender.send(
      events.HANDLE_ERRORS,
      clusterInitError(VPC_STACK_STATUS, 'VPC Stack', err),
    );
  }

  // CREATE AWS CLUSTER
  try {
    logStep('ipcMain.on(events.CREATE_CLUSTER)');

    await createCluster(data.clusterName);

    // Send Cluster status to render thread to display
    event.sender.send(events.HANDLE_STATUS_CHANGE, { status: CREATED });

    // Send Worker Node status to render thread to display
    event.sender.send(events.HANDLE_STATUS_CHANGE, {
      type: WORKER_NODE_STATUS,
      status: CREATING,
    });
  } catch (err) {
    logWithLabel(CLUSTER_STATUS, err);

    event.sender.send(
      events.HANDLE_ERRORS,
      clusterInitError(CLUSTER_STATUS, 'Cluster', err),
    );
  }

  // CREATE KUBECONFIG FILE, CONFIGURE KUBECTL, CREATE WORKER NODE STACK
  try {
    await createConfigFile(data.clusterName);
    await configureKubectl(data.clusterName);
    // testKubectlGetSvc();
    await createStackForWorkerNode(data.clusterName);

    // Send Worker Node status to render thread to display
    event.sender.send(events.HANDLE_STATUS_CHANGE, { status: CREATED });

    // Send kubectl status to render thread to display
    event.sender.send(events.HANDLE_STATUS_CHANGE, {
      type: KUBECTL_CONFIG_STATUS,
      status: CREATING,
    });
  } catch (err) {
    logLabeledError(WORKER_NODE_STATUS, err);

    event.sender.send(
      events.HANDLE_ERRORS,
      clusterInitError(WORKER_NODE_STATUS, 'Worker Node Stack', err),
    );
  }

  // CREATE NODE INSTANCE AND TEST KUBECTL CONFIG STATUS
  try {
    await inputNodeInstance(data.clusterName);
    const kubectlConfigStatusTest = await testKubectlStatus();

    if (kubectlConfigStatusTest === true) {
      await timeout(1000 * 15);

      // Send kubectl status to render thread to display
      event.sender.send(events.HANDLE_STATUS_CHANGE, { status: CREATED });
      // Send instructions to render thread to generate graph
      event.sender.send(events.HANDLE_NEW_NODES, kubectlConfigStatusTest);
    } else {
      // Send error message to render thread to display
      event.sender.send(events.HANDLE_ERRORS, 'An error ocurred while configuring kubectl');
    }
  } catch (err) {
    logLabeledError('configuring Kubectl', err);

    event.sender.send(
      events.HANDLE_ERRORS,
      clusterInitError(KUBECTL_CONFIG_STATUS, 'kubectl', err),
    );
  }
}

module.exports = {
  createClusterHandler,
}