module.exports = {
  // App identity - Generic Omoplata app
  name: 'Omoplata',
  slug: 'omoplata',
  bundleIdentifier: 'com.omoplata.app',
  owner: 'omoplata',
  easProjectId: 'ce7caf25-ffcd-4916-a58b-c8b29682d3cd', // You may want a different project ID for generic build

  // Branding - Generic icons
  icon: './assets/_global/icon.png',
  adaptiveIcon: {
    foregroundImage: './assets/_global/adaptive-icon.png',
    backgroundColor: '#ffffff',
  },
  splash: {
    image: './assets/_global/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },

  // Theme colors - Neutral/generic
  theme: {
    primary: '#2196F3',
    secondary: '#64B5F6',
    background: '#ffffff',
    text: '#333333',
  },

  // Localization - Default English
  language: 'en', // de, en, pt-BR

  // Tenant is undefined for generic build - users select at runtime
  tenant: undefined,
};
