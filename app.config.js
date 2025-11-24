if (!process.env.TENANT) {
  throw new Error(
    'TENANT environment variable is required. Use TENANT=MAIN for generic build with tenant selection, or TENANT=evolve for club-specific build.'
  );
}

const tenantEnv = process.env.TENANT;
const isGenericBuild = tenantEnv.toUpperCase() === 'MAIN';

// Load tenant config
let config;
try {
  // For generic build, use main config. For specific tenants, use their config.
  const configName = isGenericBuild ? 'main' : tenantEnv;
  config = require('./configs/' + configName + '.js');
} catch (_e) {
  throw new Error(`Invalid TENANT environment variable: ${tenantEnv}. Config file not found.`);
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
    plugins: [
      'expo-router',
      'expo-font',
      [
        'expo-camera',
        {
          cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera for check-in',
        },
      ],
    ],
    orientation: 'portrait',
    icon: config.icon,
    userInterfaceStyle: 'automatic',
    splash: config.splash,
    assetBundlePatterns: ['assets/_global/**/*', `assets/${config.slug}/**/*`],
    ios: {
      supportsTablet: true,
      bundleIdentifier: config.bundleIdentifier,
    },
    android: {
      package: config.bundleIdentifier,
      adaptiveIcon: config.adaptiveIcon,
      softwareKeyboardLayoutMode: 'pan',
      predictiveBackGestureEnabled: false,
      config: {
        enableOnBackInvokedCallback: false,
      },
    },
    extra: {
      ...config,
      // If generic build (TENANT=MAIN), tenant is undefined and users select at runtime
      // If club-specific build (TENANT=evolve), tenant is set here
      tenant: isGenericBuild ? undefined : tenantEnv,
      env: process.env.APP_ENV || 'development',
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
