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
      typedRoutes: false,
    },
    platforms: ['ios', 'android'],
    plugins: [
      'expo-router',
      'expo-font',
      'expo-splash-screen',
      './plugins/withIosInfoPlistLocalization',
      [
        'expo-media-library',
        {
          photosPermission: 'Allow $(PRODUCT_NAME) to access your photos.',
          savePhotosPermission:
            'Allow $(PRODUCT_NAME) to save your membership card to your photo library.',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera for check-in',
        },
      ],
      [
        'expo-notifications',
        {
          // Android notification icon (96x96 white-on-transparent PNG)
          // Tenant-specific: assets/<tenant>/notification-icon.png
          // Fallback: assets/_global/notification-icon.png
          icon: config.notificationIcon || './assets/_global/notification-icon.png',
          // Android notification color (uses tenant primary color)
          color: config.theme?.primary || '#2196F3',
        },
      ],
    ],
    orientation: 'portrait',
    icon: config.icon,
    userInterfaceStyle: 'automatic',
    splash: config.splash,
    assetBundlePatterns: ['assets/_global/**/*', `assets/${config.slug}/**/*`],
    ios: {
      supportsTablet: false,
      bundleIdentifier: config.bundleIdentifier,
      associatedDomains: [`applinks:${config.universalLinkDomain}`],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryAddUsageDescription:
          'Allow $(PRODUCT_NAME) to save your membership card to your photo library',
      },
    },
    android: {
      package: config.bundleIdentifier,
      adaptiveIcon: config.adaptiveIcon,
      softwareKeyboardLayoutMode: 'pan',
      predictiveBackGestureEnabled: false,
      config: {
        enableOnBackInvokedCallback: false,
      },
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: config.universalLinkDomain,
              pathPrefix: '/',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    extra: {
      ...config,
      // If generic build (TENANT=MAIN), tenant is undefined and users select at runtime
      // If club-specific build (TENANT=evolve), tenant is set here
      tenant: isGenericBuild ? undefined : tenantEnv,
      env: process.env.APP_ENV || 'development',
      apiSigningSecret: process.env.API_SIGNING_SECRET,
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
