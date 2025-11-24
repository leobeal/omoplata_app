import '../global.css';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { ScrollToTopProvider } from '@/contexts/ScrollToTopContext';
import { AppConfigProvider } from '@/contexts/AppConfigContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocalizationProvider>
        <ThemeProvider>
          <AppConfigProvider>
            <TenantProvider>
              <AuthProvider>
                <ScrollToTopProvider>
                  <Stack screenOptions={{ headerShown: false }} />
                </ScrollToTopProvider>
              </AuthProvider>
            </TenantProvider>
          </AppConfigProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </GestureHandlerRootView>
  );
}
