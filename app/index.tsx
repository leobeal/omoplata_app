import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

const appName = Constants.expoConfig?.name ?? 'Omoplata';

export default function Dashboard() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-6">
        <Text className="text-3xl font-bold text-gray-900">Dashboard</Text>
        <Text className="text-gray-500 mt-2">Welcome to {appName}</Text>
      </View>
    </SafeAreaView>
  );
}
