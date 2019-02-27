const fs = require('fs');
const fsp = require('fs').promises;

const kubernetesTemplates = {};


//** Template for Create Pod Yaml 
kubernetesTemplates.createPodYamlTemplate = (data) => {

  const podYamlTemplate = {
      apiVersion: "v1",
      kind: "Pod",
      metadata: {
        name: `${data.podName}`,
        labels: {
          app: "myapp"
        }
      },
      spec: {
        containers: [
          {
            name: `${data.containerName}`,
            image: `${data.imageName}`,
            imagePullPolicy: "Always",
            env: [
              // {
              //   name: "DEMO_GREETING",
              //   value: "Hello from the environment"
              // }
            ],
            command: ["sh", "-c", "echo Hello Kubernetes! && sleep 3600"]
          }
        ]
      }
    };
  
  console.log("podYamlTemplate generated: ", podYamlTemplate)
  return podYamlTemplate;
}

//** Template for Create Service Yaml
kubernetesTemplates.createServiceYamlTemplate = (data) => {

  const serviceYamlTemplate = {
    apiVersion: "v1",
    kind: "Service",
    metadata: {
      name: `${data.name}`
    },
    spec: {
      selector: {
        app: `${data.appName}`
      },
      ports: [
        {
          protocol: "TCP",
          port: Number(`${data.port}`),
          targetPort: Number(`${data.targetPort}`)
        }
      ]
    }
  } 
  return serviceYamlTemplate;
}


//** Template for Create Deployment Yaml

kubernetesTemplates.createDeploymentYamlTemplate = (data) => {

  const deploymentTemplate = {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name: `${data.deploymentName}`,
      labels: {
        app: `${data.appName}`
      }
    },
    spec: {
      replicas: Number(`${data.replicas}`),
      selector: {
        matchLabels: {
          app: `${data.appName}`
        }
      },
      template: {
        metadata: {
          labels: {
            app: `${data.appName}`
          }
        },
        spec: {
          containers: [
            {
              name: `${data.containerName}`,
              image: `${data.image}`,
              ports: [
                {
                  containerPort: Number(`${data.containerPort}`)
                }
              ]
            }
          ]
        }
      }
    }
  }

  return deploymentTemplate;
};  

module.exports = kubernetesTemplates;
