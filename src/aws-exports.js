// src/aws-exports.js
const awsmobile = {
  // Make sure these match your User Pool's region
  aws_project_region: "us-east-2",
  aws_cognito_region: "us-east-2",

  // ✅ Fill this with your real User Pool ID
  aws_user_pools_id: "us-east-2_XXXXXXXX",

  // ✅ Your real App Client ID (provided)
  aws_user_pools_web_client_id: "5scd368qedv001d8n687l3lbf2",

  oauth: {},

  // Optional: only include if you actually use an Identity Pool (guest/unauth access)
  // aws_cognito_identity_pool_id: "us-east-2:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",

  // These are fine to keep as-is
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
