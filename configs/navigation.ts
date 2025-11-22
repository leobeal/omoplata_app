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
 * Full navigation configuration with all available tabs
 *
 * This defines ALL possible tabs with their icons, labels, and hrefs.
 * The API only specifies WHICH tabs to show (by name), not their configuration.
 *
 * Example:
 * - This file defines: { name: "index", icon: "Home", label: "nav.dashboard", href: "/" }
 * - API returns: ["index", "membership", "settings"] (just the names)
 * - App filters this config to show only the tabs specified by API
 *
 * If API fails or returns nothing, all tabs below are shown by default.
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
      name: 'membership',
      icon: 'Award',
      label: 'nav.membership',
      href: '/membership',
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
