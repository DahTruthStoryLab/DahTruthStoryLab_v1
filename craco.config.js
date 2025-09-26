// craco.config.js
const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // "@/x" now resolves to "src/x"
    },
  },
};
