module.exports = {
  // App identity
  name: 'Sparta',
  slug: 'sparta',
  bundleIdentifier: 'com.anonymous.sparta',
  owner: 'thomino',
  easProjectId: '', // Add your EAS project ID

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
};
