import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: 'us-east-2',
    userPoolId: 'us-east-2_FGE9qe56F',
    userPoolWebClientId: '5scd368qedv001d8n687l3lbf2',
    mandatorySignIn: false,
  }
});
