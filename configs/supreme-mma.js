module.exports = {
  // App identity
  name: 'Supreme MMA',
  slug: 'supreme-mma',
  bundleIdentifier: 'de.omoplata.suprememma',
  owner: 'omoplata',
  easProjectId: 'c243f72b-9ede-44e6-ba66-4d3b5a6e4227',
  googleServicesFile: './service-keys/supreme-mma-google-services.json',

  icon: './assets/supreme-mma/icon.png',
  adaptiveIcon: {
    foregroundImage: './assets/supreme-mma/adaptive-icon.png',
    backgroundColor: '#000000',
  },
  splash: {
    image: './assets/supreme-mma/splash-icon-light.png',
    imageWidth: 288,
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },

  // Theme colors (accessible via Constants.expoConfig.extra)
  theme: {
    primary: '#1d37a3',
    secondary: '#1d37a3',
  },

  // Localization
  language: 'de', // de, en, pt-BR

  // Universal Links / App Links (production only)
  deepLinking: {
    ios: {
      associatedDomains: [
        'applinks:supreme-mma.omoplata.de',
        'webcredentials:supreme-mma.omoplata.de',
      ],
    },
    android: {
      intentFilters: [{ scheme: 'https', host: 'supreme-mma.omoplata.de', pathPrefix: '/' }],
    },
  },

  // Screen backgrounds
  loginBackground: 'https://supreme-mma.omoplata.de/images/clubs/supreme-mma/login-bg.jpg',
  forgotPasswordBackground:
    'https://supreme-mma.omoplata.de/images/clubs/supreme-mma/forgot-password-bg.jpg',
  dashboardBackground: 'https://supreme-mma.omoplata.de/images/clubs/supreme-mma/dashboard-bg.jpg',
};
