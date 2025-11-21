if (!process.env.TENANT) {
  throw new Error('TENANT environment variable is required');
}

let config;
try {
  config = require('./configs/' + process.env.TENANT + '.js');
} catch (e) {
  throw new Error(`Invalid TENANT environment variable: ${process.env.TENANT}`);
}

const version = '1.0.0';

module.exports = {
  expo: {
    newArchEnabled: true,
    name: config.name,
    slug: config.slug,
    version,
    runtimeVersion: version,
    scheme: config.slug,
    experiments: {
      tsconfigPaths: true,
      typedRoutes: true,
    },
    platforms: ['ios', 'android'],
    plugins: ['expo-router', 'expo-font'],
    orientation: 'portrait',
    icon: config.icon,
    userInterfaceStyle: 'automatic',
    splash: config.splash,
    assetBundlePatterns: [
      'assets/_global/**/*',
      `assets/${config.slug}/**/*`,
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: config.bundleIdentifier,
    },
    android: {
      adaptiveIcon: config.adaptiveIcon,
      softwareKeyboardLayoutMode: 'pan',
      predictiveBackGestureEnabled: false,
      config: {
        enableOnBackInvokedCallback: false,
      },
    },
    extra: {
      ...config,
      router: {
        origin: false,
      },
      eas: {
        projectId: config.easProjectId,
      },
    },
    owner: config.owner,
    updates: {
      url: `https://u.expo.dev/${config.easProjectId}`,
    },
  },
};
