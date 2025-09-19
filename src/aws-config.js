import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: 'us-east-2',
    userPoolId: 'us-east-2_FGE9qe56F',
    userPoolWebClientId: '1517eqvl8en7jhgsg9h8gah1va',
    mandatorySignIn: false,
  }
});
