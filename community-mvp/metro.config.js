const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;

/** @type {import('metro-config').ConfigT} */
const config = getDefaultConfig(projectRoot);

config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'react-native/Libraries/Core/Devtools/getDevServer': path.resolve(
    projectRoot,
    './metro-shims/getDevServer.js',
  ),
};

module.exports = config;

