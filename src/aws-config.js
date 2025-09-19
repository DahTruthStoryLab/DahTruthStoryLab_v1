// amplify-config.js
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: 'YOUR_POOL_REGION',            // e.g., us-east-2 (Ohio) — confirm on the pool Overview page
    userPoolId: 'YOUR_USER_POOL_ID',       // e.g., us-east-2_XXXXXXX
    userPoolWebClientId: '5scd368qedv001d8n687l3lbf2', // <- the ID from your screenshot
    mandatorySignIn: false,
  },
});
