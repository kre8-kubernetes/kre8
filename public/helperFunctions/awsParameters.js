const awsParameters = {};

//** Parameter for CREATE_IAM_ROLE 
awsParameters.createIAMRoleParam = (roleName, roleDescription, iamRolePolicyDocument) => {
  const iamRoleParam = {
    AssumeRolePolicyDocument: JSON.stringify(iamRolePolicyDocument),
    RoleName: roleName,
    Description: roleDescription,
    Path: '/', 
  };
  return iamRoleParam;
}


//** Parameter for CREATE_TECH_STACK 
awsParameters.createTechStackParam = (stackName, stackTemplateStringified) => {
  const techStackParam = {
    StackName: stackName,
    DisableRollback: false,
    EnableTerminationProtection: false,
    Parameters: [
      { ParameterKey: 'VpcBlock', ParameterValue: '192.168.0.0/16', },
      { ParameterKey: 'Subnet01Block', ParameterValue: '192.168.64.0/18', },
      { ParameterKey: 'Subnet02Block', ParameterValue: '192.168.128.0/18', },
      { ParameterKey: 'Subnet03Block', ParameterValue: '192.168.192.0/18', }
    ],
    TemplateBody: stackTemplateStringified,
  };
  return techStackParam;
}

//** Parameter for CREATE_CLUSTER 
awsParameters.createClusterParam = (clusterName, subnetIds, securityGroupIds, roleArn) => {
  const clusterParam = {
    name: clusterName, 
    resourcesVpcConfig: {
      subnetIds: subnetIds,
      securityGroupIds: [
        securityGroupIds
      ]
    },
    roleArn: roleArn, 
  }
  return clusterParam;
}


//** Parameter for CREATE_CONFIG_FILE 
awsParameters.createConfigParam = (clusterName, serverEndpoint, certificateAuthorityData, clusterArn) => {
  const AWSClusterConfigFileParam = {
    "apiVersion": "v1",
    "clusters": [
        {
            "cluster": {
                "server": serverEndpoint,
                "certificate-authority-data": certificateAuthorityData,
            },
            "name": "kubernetes"
        },
        {
            "cluster": {
                "certificate-authority-data": certificateAuthorityData,
                "server": serverEndpoint
            },
            "name": clusterArn
        }
    ],
    "contexts": [
        {
            "context": {
                "cluster": "kubernetes",
                "user": "aws"
            },
            "name": "aws"
        },
        {
            "context": {
                "cluster": clusterArn,
                "user": clusterArn
            },
            "name": clusterArn
        }
    ],
    "current-context": clusterArn,
    "kind": "Config",
    "preferences": {},
    "users": [
        {
            "name": "aws",
            "user": {
                "exec": {
                    "apiVersion": "client.authentication.k8s.io/v1alpha1",
                    "command": "aws-iam-authenticator",
                    "args": [
                        "token",
                        "-i",
                        clusterName
                    ]
                }
            }
        },
        {
            "name": clusterArn,
            "user": {
                "exec": {
                    "apiVersion": "client.authentication.k8s.io/v1alpha1",
                    "args": [
                        "token",
                        "-i",
                        clusterName
                    ],
                    "command": "aws-iam-authenticator"
                }
            }
        }
    ]
  }
  return AWSClusterConfigFileParam;
}


//** Parameter for CREATE_WORKER_NODE_TECH_STACK 
awsParameters.createIAMRoleParam = (roleName, roleDescription, iamRolePolicyDocument) => {
  const iamRoleParam = {
    AssumeRolePolicyDocument: JSON.stringify(iamRolePolicyDocument),
    RoleName: roleName,
    Description: roleDescription,
    Path: '/', 
  };
  return iamRoleParam;
}


module.exports = awsParameters;