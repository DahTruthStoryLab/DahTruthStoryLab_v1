// amplify-config.ts (or wherever you init Amplify – runs once at app start)
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';

Amplify.configure(awsExports); // base config

// Override just the client id with your PUBLIC (no secret) client id
Amplify.configure({
  Auth: {
    userPoolWebClientId: '5scd368qedv001d8n687l3lbf2', // <- your no-secret client id
  },
});
