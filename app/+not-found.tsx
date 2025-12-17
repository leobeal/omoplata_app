import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

/**
 * Handles unmatched routes (404s)
 * If the URL is a Universal Link that doesn't match any app screen,
 * open it in the browser instead - the user likely wanted the web version.
 * Otherwise, redirect to home.
 */
export default function NotFound() {
  const url = Linking.useURL();
  const [shouldRedirectHome, setShouldRedirectHome] = useState(false);

  useEffect(() => {
    const handleUnmatchedRoute = async () => {
      if (!url) {
        setShouldRedirectHome(true);
        return;
      }

      try {
        const parsed = Linking.parse(url);
        const hostname = parsed.hostname || '';

        // Check if it's one of our Universal Link domains
        const isOurDomain =
          hostname.endsWith('.omoplata.de') ||
          hostname.endsWith('.omoplata.eu') ||
          hostname.endsWith('.sportsmanager.test');

        if (isOurDomain && parsed.path) {
          // Open the original URL in the browser
          await Linking.openURL(url);
        }
      } catch (error) {
        console.error('Failed to open URL in browser:', error);
      }

      // Always redirect to home after attempting to open browser
      setShouldRedirectHome(true);
    };

    handleUnmatchedRoute();
  }, [url]);

  if (shouldRedirectHome) {
    return <Redirect href="/" />;
  }

  // Show brief loading while we open the browser
  return (
    <View style={{ flex: 1, backgroundColor: '#141414', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#ffffff" />
    </View>
  );
}
