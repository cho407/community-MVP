const NativeSourceCode = require('react-native/Libraries/NativeModules/specs/NativeSourceCode');

let cachedDevServerUrl;
let cachedFullBundleUrl;
const FALLBACK_URL = 'http://localhost:8081/';

function getDevServer() {
  if (cachedDevServerUrl === undefined) {
    const scriptUrl = NativeSourceCode.getConstants().scriptURL;
    const match = scriptUrl?.match?.(/^https?:\/\/.*?\//);
    cachedDevServerUrl = match ? match[0] : null;
    cachedFullBundleUrl = match ? scriptUrl : null;
  }

  return {
    url: cachedDevServerUrl ?? FALLBACK_URL,
    fullBundleUrl: cachedFullBundleUrl ?? null,
    bundleLoadedFromServer: cachedDevServerUrl !== null,
  };
}

module.exports = getDevServer;
module.exports.default = getDevServer;

