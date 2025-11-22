const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Force cache reset and improve resolver
config.resetCache = true;
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), 'js', 'jsx', 'ts', 'tsx', 'json'],
};

module.exports = withNativeWind(config, { input: './global.css' });
