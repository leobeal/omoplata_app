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
      name: 'leaderboard',
      icon: 'Trophy',
      label: 'nav.leaderboard',
      href: '/leaderboard',
    },
    {
      name: 'calendar',
      icon: 'Calendar',
      label: 'nav.classes',
      href: '/calendar',
    },
    {
      name: 'billing',
      icon: 'CreditCard',
      label: 'nav.billing',
      href: '/billing',
    },
  ],
  showCheckInButton: true,
};
