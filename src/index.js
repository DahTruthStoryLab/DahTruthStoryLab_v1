// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// 👇 Add these lines:
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';

// Configure Amplify once, before React renders
Amplify.configure(awsconfig);

// (optional) quick sanity check in the console:
// import { Auth } from 'aws-amplify';
// console.log('Auth flow:', Auth.configure().authenticationFlowType);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
