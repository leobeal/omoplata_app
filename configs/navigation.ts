import { IconName } from '@/components/Icon';

export interface NavigationTab {
  name: string;
  icon: IconName;
  label: string;
  href: string;
}

export interface NavigationConfig {
  tabs: NavigationTab[];
  showCheckInButton?: boolean;
}

/**
 * Default navigation configuration
 * Used if tenant doesn't specify custom navigation
 */
export const defaultNavigation: NavigationConfig = {
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
};
