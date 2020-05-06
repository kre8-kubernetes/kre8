import {
  setLocale,
  object,
  string,
  number 
} from 'yup';

const stringRequired = (requiredError, minLength = 1, maxLength = 500) => (
  string()
    .required(requiredError)
    .lowercase()
    .min(minLength)
    .max(maxLength)
);

const positiveNum = (message, min = 0, max = 100) => (
  number()
    .required('Container port is required')
    .positive()
    .min(min)
    .max(max)
);

export const podFormValidate = (pod) => {
  return (
    object()
      .strict()
      .shape({
        podName: stringRequired('Pod name is required', 3, 256),
        containerName: stringRequired('Container name is required', 3, 256),
        imageName: stringRequired('Image name is required', 3, 256),
      })
      .validate(pod, { abortEarly: false })
  );
};

export const deploymentFormValidate = (deployment) => {
  return (
    object()
      .strict()
      .shape({
        deploymentName: stringRequired('Deployment name is required'),
        applicationName: stringRequired('Application name is required'),
        containerName: stringRequired('Container name is required'),
        image: stringRequired('Image name is required'),
        containerPort: positiveNum('Container port is required'),
        replicas: positiveNum('Number of replicas is required', 1, 4),
      })
      .validate(deployment, { abortEarly: false })
  )
};

export const serviceFormValidate = (service) => {
  return (
    object()
      .strict()
      .shape({
        serviceName: stringRequired('Service name is required'),
        applicationName: stringRequired('Application name is required'),
        port: positiveNum('Port number is required'),
        targetPort: positiveNum('Target port number is required'),
      })
      .validate(service, { abortEarly: false })
  );
};

export const makeError = (err) =>  {
  return err.inner.reduce((acc, error) => {
    acc[error.path] = error.message;
    return acc;
  }, {});
};
