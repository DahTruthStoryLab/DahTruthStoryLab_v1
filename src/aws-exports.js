// src/aws-exports.js
const awsmobile = {
  // Must match your Cognito User Pool region
  aws_project_region: "us-east-2",
  aws_cognito_region: "us-east-2",

  // Your real Cognito User Pool + App Client IDs
  aws_user_pools_id: "us-east-2_cia1t3",
  aws_user_pools_web_client_id: "5scd368qedv001d8n687l3lbf2",

  // Leave empty unless you're using hosted UI / social providers
  oauth: {},

  // Optional: remove if you don't use an Identity Pool (guest/unauth access)
  // aws_cognito_identity_pool_id: "us-east-2:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",

  // These defaults are fine unless your pool is configured differently
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
};

export default awsmobile;
