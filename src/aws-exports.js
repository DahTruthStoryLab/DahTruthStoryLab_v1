// src/aws-exports.js
const awsmobile = {
  aws_project_region: "us-east-2",
  aws_cognito_region: "us-east-2",
  aws_user_pools_id: "us-east-2_cia1t3",
  aws_user_pools_web_client_id: "5scd368qedv001d8n687l3lbf2",
  oauth: {},

  // Optional but recommended to keep Auth block aligned with your app client
  Auth: {
    region: "us-east-2",
    userPoolId: "us-east-2_cia1t3",
    userPoolWebClientId: "5scd368qedv001d8n687l3lbf2",
    authenticationFlowType: "USER_PASSWORD_AUTH",
    mandatorySignIn: false,
  },

  // Email-as-username setup
  aws_cognito_username_attributes: ["EMAIL"],
  aws_cognito_signup_attributes: ["EMAIL"],

  // MFA off
  aws_cognito_mfa_configuration: "OFF",
  aws_cognito_verification_mechanisms: ["EMAIL"],
};

export default awsmobile; 
