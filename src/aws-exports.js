// src/aws-exports.js
const awsmobile = {
  // Regions
  aws_project_region: "us-east-2",
  aws_cognito_region: "us-east-2",

  // Cognito IDs (verify these match your pool + app client exactly)
  aws_user_pools_id: "us-east-2_cia1t3",
  aws_user_pools_web_client_id: "5scd368qedv001d8n687l3lbf2",

  // Hosted UI (unused)
  oauth: {},

  // Misc (fine to keep as-is)
  aws_cognito_username_attributes: ["EMAIL"],
  aws_cognito_social_providers: [],
  aws_cognito_signup_attributes: ["EMAIL"],
  aws_cognito_mfa_configuration: "OFF",
  aws_cognito_mfa_types: ["SMS"],
  aws_cognito_password_protection_settings: {
    passwordPolicyMinLength: 8,
    passwordPolicyCharacters: []
  },
  aws_cognito_verification_mechanisms: ["EMAIL"],

  // >>> IMPORTANT: make Amplify Auth use the same flow as your App Client
  Auth: {
    region: "us-east-2",
    userPoolId: "us-east-2_cia1t3",
    userPoolWebClientId: "5scd368qedv001d8n687l3lbf2",
    authenticationFlowType: "USER_PASSWORD_AUTH", // <- critical
    mandatorySignIn: false,
  },
};

export default awsmobile;
