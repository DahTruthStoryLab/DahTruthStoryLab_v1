// src/aws-exports.js
const awsmobile = {
  aws_project_region: "us-east-1",
  aws_cognito_region: "us-east-1",
  aws_user_pools_id: "us-east-1_M4ahggdKL",
  aws_user_pools_web_client_id: "58ugnk7kp05dj9m7fbe1450k8", // ✅ Your App Client ID
  
  oauth: {},
  
  Auth: {
    region: "us-east-1",
    userPoolId: "us-east-1_M4ahggdKL",
    userPoolWebClientId: "58ugnk7kp05dj9m7fbe1450k8", // ✅ Your App Client ID
    authenticationFlowType: "USER_PASSWORD_AUTH",
    mandatorySignIn: false,
  },
  
  aws_cognito_username_attributes: ["EMAIL"],
  aws_cognito_signup_attributes: ["EMAIL"],
  aws_cognito_mfa_configuration: "OFF",
  aws_cognito_verification_mechanisms: ["EMAIL"],
};
export default awsmobile;
