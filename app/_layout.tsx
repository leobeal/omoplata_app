import '../global.css';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { ScrollToTopProvider } from '@/contexts/ScrollToTopContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocalizationProvider>
        <ThemeProvider>
          <ScrollToTopProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </ScrollToTopProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </GestureHandlerRootView>
  );
}
