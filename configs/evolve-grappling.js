module.exports = {
  // App identity
  name: 'Evolve',
  slug: 'evolve-grappling',
  bundleIdentifier: 'de.omoplata.evolvegrappling',
  owner: 'omoplata',
  easProjectId: '526cedec-aab6-4391-b8bc-c442ca6fb49f',

  // Branding - icons
  icon: './assets/evolve-grappling/icon.png',
  adaptiveIcon: {
    foregroundImage: './assets/evolve-grappling/adaptive-icon.png',
    backgroundColor: '#ffffff',
  },
  splash: {
    image: './assets/evolve-grappling/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },

  // Theme colors (accessible via Constants.expoConfig.extra)
  theme: {
    primary: '#4CAF50',
    secondary: '#8BC34A',
  },

  // Localization
  language: 'de', // de, en, pt-BR

  // Universal Links / App Links (production only)
  deepLinking: {
    ios: {
      associatedDomains: [
        'applinks:evolve-grappling.omoplata.de',
        'applinks:*.evolve-grappling.omoplata.de',
        'webcredentials:evolve-grappling.omoplata.de',
        'webcredentials:*.evolve-grappling.omoplata.de',
      ],
    },
    android: {
      intentFilters: [
        { scheme: 'https', host: 'evolve-grappling.omoplata.de', pathPrefix: '/' },
        { scheme: 'https', host: '*.evolve-grappling.omoplata.de', pathPrefix: '/' },
      ],
    },
  },

  // Screen backgrounds
  loginBackground: 'https://evolve-grappling.omoplata.de/images/clubs/evolve-grappling/login-bg.jpg',
  forgotPasswordBackground:
    'https://evolve-grappling.omoplata.de/images/clubs/evolve-grappling/forgot-password-bg.jpg',
  dashboardBackground:
    'https://evolve-grappling.omoplata.de/images/clubs/evolve-grappling/dashboard-bg.jpg',
};
