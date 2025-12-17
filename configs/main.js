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
    image: './assets/_global/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },

  // Theme colors - Neutral/generic
  theme: {
    primary: '#2196F3',
    secondary: '#64B5F6',
    background: '#ffffff',
    text: '#333333',
  },

  // Localization
  language: 'de', // de, en, pt-BR

  // Universal Links (production only)
  universalLinkDomain: 'omoplata.de',

  // Tenant is undefined for generic build - users select at runtime
  tenant: undefined,
};
