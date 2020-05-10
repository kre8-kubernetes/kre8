/** GENERATES TEMPLATE FOR CREATING POD YAML FILE
 * @param {Object} data
 * @return {Object}
 */
const createPodYamlTemplate = (data) => {
  const podYamlTemplate = {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: `${data.podName}`,
      labels: {
        app: 'myapp',
      },
    },
    spec: {
      containers: [
        {
          name: `${data.containerName}`,
          image: `${data.imageName}`,
          imagePullPolicy: 'Always',
          env: [
            // {name: '', value: ''}
          ],
          command: ['sh', '-c', 'echo Hello Kubernetes! && sleep 3600'],
        },
      ],
    },
  };
  console.log('podYamlTemplate generated: ', podYamlTemplate);
  return podYamlTemplate;
};

/** GENERATES TEMPLATE FOR CREATING SERVICE YAML FILE
 * @param {Object} data
 * @return {Object}
 */
const createServiceYamlTemplate = (data) => {
  const serviceYamlTemplate = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: `${data.serviceName}`,
    },
    spec: {
      selector: {
        app: `${data.applicationName}`,
      },
      ports: [
        {
          protocol: 'TCP',
          port: Number(`${data.port}`),
          targetPort: Number(`${data.targetPort}`),
        },
      ],
    },
  };
  return serviceYamlTemplate;
};

/** GENERATES TEMPLATE FOR CREATING DEPLOYMENT YAML FILE
 * @param {Object} data
 * @return {Object}
 */
const createDeploymentYamlTemplate = (data) => {
  const deploymentTemplate = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: `${data.deploymentName}`,
      labels: {
        app: `${data.applicationName}`,
      },
    },
    spec: {
      replicas: Number(`${data.replicas}`),
      selector: {
        matchLabels: {
          app: `${data.applicationName}`,
        },
      },
      template: {
        metadata: {
          labels: {
            app: `${data.applicationName}`,
          },
        },
        spec: {
          containers: [
            {
              name: `${data.containerName}`,
              image: `${data.image}`,
              ports: [
                {
                  containerPort: Number(`${data.containerPort}`),
                },
              ],
            },
          ],
        },
      },
    },
  };
  return deploymentTemplate;
};

module.exports = {
  createPodYamlTemplate,
  createServiceYamlTemplate,
  createDeploymentYamlTemplate,
};
