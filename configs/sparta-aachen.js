module.exports = {
  // App identity
  name: 'Sparta',
  slug: 'sparta-aachen',
  bundleIdentifier: 'de.omoplata.spartaaachen',
  owner: 'omoplata',
  easProjectId: '5e13eeaf-5e9e-49a2-9210-c2dcceff6365', // Add your EAS project ID

  // Branding - icons
  icon: './assets/sparta/icon.png',
  adaptiveIcon: {
    foregroundImage: './assets/sparta/adaptive-icon.png',
    backgroundColor: '#ffffff',
  },
  splash: {
    image: './assets/sparta/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },

  // Theme colors (accessible via Constants.expoConfig.extra)
  theme: {
    primary: '#D32F2F',
    secondary: '#FF5722',
    background: '#ffffff',
    text: '#333333',
  },

  // Localization
  language: 'de', // de, en, pt-BR

  // Login screen
  loginBackground:
    'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=2000&auto=format&fit=crop',
};
