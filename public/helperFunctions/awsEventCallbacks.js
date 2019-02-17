const awsEventCallbacks = {};

//**--------- GENERATE AND SAVE CONFIG FILE ON USER COMPUTER ------------- **//

awsEventCallbacks.CREATE_CONFIG_FILE = (clusterName) => {

  //Access data from cluster data file, saved as cluster name, in Assets and save in variables to pass to the AWSConfigFileData object*/

  const clusterDataFileContents = fs.readFileSync(__dirname + `/sdkAssets/private/${clusterName}.js`, 'utf-8');

  const parsedclusterDataFileContents = JSON.parse(clusterDataFileContents);
  
  //Gather required data from Cluster File
  const serverEndpoint = parsedclusterDataFileContents.cluster.endpoint;
  const clusterArn = parsedclusterDataFileContents.cluster.arn;
  const certificateAuthorityData = parsedclusterDataFileContents.cluster.certificateAuthority.data;

  const AWSClusterConfigFileData = {
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
  
  //** Format data from the AWSClusterConfigFileData object into YAML to save in user's filesystem 
  let stringifiedAWSClusterConfigFile = JSON.stringify(AWSClusterConfigFileData);
  let parsedAWSClusterConfigFile = JSON.parse(stringifiedAWSClusterConfigFile);
  let yamledAWSClusterConfigFile = YAML.stringify(parsedAWSClusterConfigFile, 6);
  let regexCharToRemove = /(['])+/g;
  let yamledAWSClusterConfigFileWithoutRegex = yamledAWSClusterConfigFile.replace(regexCharToRemove, "");

  //TODO: .Kube directory, test if ~./kube directory exists, if not, mkdir -p ~/.kube

  

  //** Save data in users .kube file
  fs.writeFileSync('/Users/carolynharrold/.kube/config-carolyn-and-adrian-killer-cluster', yamledAWSClusterConfigFileWithoutRegex);

};


module.exports = awsEventCallbacks;