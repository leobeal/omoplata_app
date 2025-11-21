module.exports = {
  // App identity
  name: 'Evolve',
  slug: 'evolve',
  bundleIdentifier: 'com.anonymous.evolve',
  owner: 'thomino',
  easProjectId: '87766ac6-7feb-4131-a0c6-e7f0e78f2071',

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

  // Bottom navigation tabs
  // If not specified, uses default navigation from configs/navigation.ts
  navigation: {
    tabs: [
      {
        name: 'index',
        icon: 'Home',
        label: 'nav.dashboard',
        href: '/',
      },
      {
        name: 'billing',
        icon: 'Receipt',
        label: 'nav.billing',
        href: '/billing',
      },
      {
        name: 'settings',
        icon: 'Settings',
        label: 'nav.settings',
        href: '/settings',
      },
    ],
    showCheckInButton: true,
  },
};
