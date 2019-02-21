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
    ],
    "contexts": [
        {
            "context": {
                "cluster": "kubernetes",
                "user": "aws"
            },
            "name": "aws"
        },
    ],
    "current-context": "aws",
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
    ]
  }
  return AWSClusterConfigFileParam;
}


//** Parameter for CREATE_WORKER_NODE_TECH_STACK 

  awsParameters.createWorkerNodeStackParam = (workerNodeStackName, clusterName, subnetIds, vpcId, securityGroupIds, stackTemplateStringified, keyName) => {

    console.log(securityGroupIds);

    const workerNodeStackParam = {
      StackName: workerNodeStackName,
      Capabilities: [ "CAPABILITY_IAM" ],
      DisableRollback: false,
      EnableTerminationProtection: false,
      Parameters: [
        { "ParameterKey": "ClusterName", "ParameterValue": clusterName },
        { "ParameterKey": "ClusterControlPlaneSecurityGroup", "ParameterValue": securityGroupIds },
        { "ParameterKey": "NodeGroupName", "ParameterValue": "worker-node" },
        { "ParameterKey": "NodeAutoScalingGroupMinSize", "ParameterValue": "1" },
        { "ParameterKey": "NodeAutoScalingGroupDesiredCapacity", "ParameterValue": "3" },
        { "ParameterKey": "NodeAutoScalingGroupMaxSize", "ParameterValue": "4" },
        { "ParameterKey": "NodeInstanceType", "ParameterValue": "t3.nano" },
        { "ParameterKey": "NodeImageId", "ParameterValue": "ami-081099ec932b99961" },
        { "ParameterKey": "KeyName", "ParameterValue": keyName },
        { "ParameterKey": "VpcId", "ParameterValue": vpcId },
        { "ParameterKey": "Subnets", "ParameterValue": subnetIds }
      ],
      TemplateBody: stackTemplateStringified,
    }
    return workerNodeStackParam;
  }

  //** Parameter for INPUT NODE INSTANCE 

  awsParameters.createInputNodeInstance = (roleArn) => {

    const inputNodeInstanceParam = {
      "apiVersion": "v1",
      "kind": "ConfigMap",
      "metadata": { "name": "aws-auth", "namespace": "kube-system" },
      "data": {
        "mapRoles": [ 
          {
            "rolearn": roleArn,
            "username": "system:node:{{EC2PrivateDNSName}}",
            "groups": ["system:bootstrappers", "system:nodes"]
          } 
        ]
      }
    }
    console.log("exiting params");
    return inputNodeInstanceParam;
}


module.exports = awsParameters;
