
export const handleNewPod = (event, data) => {
  const { inputData } = this.state;
  const { pod } = inputData;
  const emptyPodObj = Object.entries(pod).reduce((acc, item) => {
    acc[item[0]] = '';
    return acc;
  }, {});
  if (data.includes('error')) {
    this.setState(prevState => ({
      ...prevState,
      creationError: true,
      creationErrorText: data,
      inputData: {
        ...prevState.inputData,
        pod: emptyPodObj,
      },
    }));
  } else {
    this.setState(prevState => ({
      ...prevState,
      inputData: {
        ...prevState.inputData,
        pod: emptyPodObj,
      },
    }));
  }
};

export const handleNewService = (event, data) => {
  // The following is going to be the logic that occurs once a new
  // role was created via the main thread process
  const { inputData } = this.state;
  const { service } = inputData;

  const emptyServiceObj = Object.entries(service).reduce((acc, item) => {
    acc[item[0]] = '';
    return acc;
  }, {});
  if (data.includes('error')) {
    this.setState(prevState => ({
      ...prevState,
      creationError: true,
      creationErrorText: data,
      inputData: {
        ...prevState.inputData,
        service: emptyServiceObj,
      },
    }));
  } else {
    this.setState(prevState => ({
      ...prevState,
      inputData: {
        ...prevState.inputData,
        service: emptyServiceObj,
      },
    }));
  }
};

export const handleNewDeployment = (event, data) => {
  const { inputData } = this.state;
  const { deployment } = inputData;
  const emptyDeploymentObj = Object.entries(deployment).reduce((acc, item) => {
    acc[item[0]] = '';
    return acc;
  }, {});
  if (data.includes('error')) {
    this.setState(prevState => ({
      ...prevState,
      creationError: true,
      creationErrorText: data,
    }));
  } else {
    this.setState(prevState => ({
      ...prevState,
      inputData: {
        ...prevState.inputData,
        deployment: emptyDeploymentObj,
      },
    }));
  }
};
