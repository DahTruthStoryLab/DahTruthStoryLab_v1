// amplify-config.js
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: 'us-east-2',                // confirm your pool’s region
    userPoolId: 'us-east-2_xxxxxxx',    // your pool ID
    userPoolWebClientId: '5scd368qedv001d8n687l3lbf2', // <- public client
    mandatorySignIn: false,
  },
});
