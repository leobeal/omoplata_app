import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

interface NetworkContextType {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  checkConnection: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  isInternetReachable: null,
  connectionType: null,
  checkConnection: async () => true,
});

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  const handleNetworkChange = useCallback((state: NetInfoState) => {
    const online = state.isConnected === true && state.isInternetReachable !== false;
    setIsOnline(online);
    setIsInternetReachable(state.isInternetReachable);
    setConnectionType(state.type);

    if (!online) {
      console.log('[Network] Device went offline');
    } else {
      console.log('[Network] Device is online');
    }
  }, []);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then(handleNetworkChange);

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      unsubscribe();
    };
  }, [handleNetworkChange]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    const online = state.isConnected === true && state.isInternetReachable !== false;
    setIsOnline(online);
    return online;
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        isInternetReachable,
        connectionType,
        checkConnection,
      }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
}

export function useIsOnline() {
  const { isOnline } = useNetwork();
  return isOnline;
}
