import '../global.css';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { ScrollToTopProvider } from '@/contexts/ScrollToTopContext';
import { AppConfigProvider } from '@/contexts/AppConfigContext';
import { TenantProvider } from '@/contexts/TenantContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocalizationProvider>
        <ThemeProvider>
          <AppConfigProvider>
            <TenantProvider>
              <ScrollToTopProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </ScrollToTopProvider>
            </TenantProvider>
          </AppConfigProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </GestureHandlerRootView>
  );
}
