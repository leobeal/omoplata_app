module.exports = {
  // App identity
  name: 'Evolve',
  slug: 'evolve-grappling',
  bundleIdentifier: 'de.omoplata.evolve-grappling',
  owner: 'omoplata',
  easProjectId: '526cedec-aab6-4391-b8bc-c442ca6fb49f',

  // Branding - icons
  icon: './assets/evolve/icon.png',
  adaptiveIcon: {
    foregroundImage: './assets/evolve/adaptive-icon.png',
    backgroundColor: '#ffffff',
  },
  splash: {
    image: './assets/evolve/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },

  // Theme colors (accessible via Constants.expoConfig.extra)
  theme: {
    primary: '#4CAF50',
    secondary: '#8BC34A',
    background: '#ffffff',
    text: '#333333',
  },

  // Localization
  language: 'de', // de, en, pt-BR

  // Login screen
  loginBackground:
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2000&auto=format&fit=crop',
};
