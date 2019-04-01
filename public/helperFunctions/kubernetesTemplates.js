//* --------- NODE APIS ----------------

//* --------- DECLARE EXPORT OBJECT --------------------------
const kubernetesTemplates = {};

/** --------- GENERATES TEMPLATE FOR CREATING POD YAML FILE----------
 * @param {Object} data
 */
kubernetesTemplates.createPodYamlTemplate = (data) => {
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

/** --------- GENERATES TEMPLATE FOR CREATING SERVICE YAML FILE----------
 * @param {Object} data
 */
kubernetesTemplates.createServiceYamlTemplate = (data) => {
  const serviceYamlTemplate = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: `${data.serviceName}`,
    },
    spec: {
      selector: {
        app: `${data.appName}`,
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

/** --------- GENERATES TEMPLATE FOR CREATING DEPLOYMENT YAML FILE ----
 * @param {Object} data
 */
kubernetesTemplates.createDeploymentYamlTemplate = (data) => {
  const deploymentTemplate = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: `${data.deploymentName}`,
      labels: {
        app: `${data.appName}`,
      },
    },
    spec: {
      replicas: Number(`${data.replicas}`),
      selector: {
        matchLabels: {
          app: `${data.appName}`,
        },
      },
      template: {
        metadata: {
          labels: {
            app: `${data.appName}`,
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

module.exports = kubernetesTemplates;
