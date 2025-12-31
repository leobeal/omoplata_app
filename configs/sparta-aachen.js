module.exports = {
  // App identity
  name: 'Sparta',
  slug: 'sparta-aachen',
  bundleIdentifier: 'de.omoplata.spartaaachen',
  owner: 'omoplata',
  easProjectId: '5e13eeaf-5e9e-49a2-9210-c2dcceff6365', // Add your EAS project ID

  // Branding - icons
  icon: './assets/sparta-aachen/icon.png',
  adaptiveIcon: {
    foregroundImage: './assets/sparta-aachen/adaptive-icon.png',
    backgroundColor: '#ffffff',
  },
  splash: {
    image: './assets/sparta-aachen/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },

  // Theme colors (accessible via Constants.expoConfig.extra)
  theme: {
    primary: '#D32F2F',
    secondary: '#FF5722',
  },

  // Localization
  language: 'de', // de, en, pt-BR

  // Universal Links / App Links (production only)
  deepLinking: {
    ios: {
      associatedDomains: [
        'applinks:sparta-aachen.omoplata.de',
        'applinks:*.sparta-aachen.omoplata.de',
        'webcredentials:sparta-aachen.omoplata.de',
        'webcredentials:*.sparta-aachen.omoplata.de',
      ],
    },
    android: {
      intentFilters: [
        { scheme: 'https', host: 'sparta-aachen.omoplata.de', pathPrefix: '/' },
        { scheme: 'https', host: '*.sparta-aachen.omoplata.de', pathPrefix: '/' },
      ],
    },
  },

  // Screen backgrounds
  loginBackground: 'https://sparta-aachen.omoplata.de/images/clubs/sparta-aachen/login-bg.jpg',
  forgotPasswordBackground:
    'https://sparta-aachen.omoplata.de/images/clubs/sparta-aachen/forgot-password-bg.jpg',
  dashboardBackground:
    'https://sparta-aachen.omoplata.de/images/clubs/sparta-aachen/dashboard-bg.jpg',
};
