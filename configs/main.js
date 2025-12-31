module.exports = {
  // App identity - Generic Omoplata app
  name: 'Omoplata',
  slug: 'omoplata',
  bundleIdentifier: 'de.omoplata.app',
  owner: 'omoplata',
  easProjectId: '3bff59d5-a63b-4bdd-b2ed-ea12e293de46',

  // Branding - Geaseneric icons
  icon: './assets/_global/icon.png',
  adaptiveIcon: {
    foregroundImage: './assets/_global/adaptive-icon.png',
    backgroundColor: '#000000',
  },
  splash: {
    image: './assets/_global/splash-icon-light.png',
    imageWidth: 200,
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
    dark: {
      image: './assets/_global/splash-icon-dark.png',
      backgroundColor: '#000000',
    },
  },

  // Theme colors - Neutral/generic
  theme: {
    primary: '#2196F3',
    secondary: '#64B5F6',
  },

  // Localization
  language: 'de', // de, en, pt-BR

  // Universal Links / App Links (production only)
  deepLinking: {
    ios: {
      associatedDomains: [
        'applinks:omoplata.de',
        'applinks:*.omoplata.de',
        'applinks:test-club.omoplata.de',
        'webcredentials:omoplata.de',
        'webcredentials:*.omoplata.de',
        'webcredentials:test-club.omoplata.de',
      ],
    },
    android: {
      intentFilters: [
        { scheme: 'https', host: 'omoplata.de', pathPrefix: '/' },
        { scheme: 'https', host: '*.omoplata.de', pathPrefix: '/' },
      ],
    },
  },

  // Tenant is undefined for generic build - users select at runtime
  tenant: undefined,

  // Screen backgrounds (optional - uses default if not set)
  // loginBackground: 'https://{slug}.omoplata.de/images/clubs/{slug}/login-bg.jpg',
  // forgotPasswordBackground: 'https://{slug}.omoplata.de/images/clubs/{slug}/forgot-password-bg.jpg',
  // dashboardBackground: 'https://{slug}.omoplata.de/images/clubs/{slug}/dashboard-bg.jpg',
};
