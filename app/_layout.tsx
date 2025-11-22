import '../global.css';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { ScrollToTopProvider } from '@/contexts/ScrollToTopContext';
import { AppConfigProvider } from '@/contexts/AppConfigContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocalizationProvider>
        <ThemeProvider>
          <AppConfigProvider>
            <ScrollToTopProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </ScrollToTopProvider>
          </AppConfigProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </GestureHandlerRootView>
  );
}
