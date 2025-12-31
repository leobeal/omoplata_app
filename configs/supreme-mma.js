module.exports = {
  // App identity
  name: 'Supreme MMA',
  slug: 'supreme-mma',
  bundleIdentifier: 'de.omoplata.suprememma',
  owner: 'omoplata',
  easProjectId: 'c243f72b-9ede-44e6-ba66-4d3b5a6e4227',

  // Branding - icons
  icon: './assets/supreme-mma/icon.png',
  adaptiveIcon: {
    foregroundImage: './assets/supreme-mma/adaptive-icon.png',
    backgroundColor: '#000000',
  },
  splash: {
    image: './assets/supreme-mma/splash-icon-light.png',
    imageWidth: 200,
    backgroundColor: '#000000',
  },

  // Theme colors (accessible via Constants.expoConfig.extra)
  theme: {
    primary: '#1d37a3',
    secondary: '#1d37a3',
  },

  // Localization
  language: 'de', // de, en, pt-BR

  // Universal Links (production only)
  universalLinkDomain: 'supreme-mma.omoplata.de',

  loginBackground:
    'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=2000&auto=format&fit=crop',
};
