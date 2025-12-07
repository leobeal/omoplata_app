import { api } from './client';
import { ENDPOINTS } from './config';

interface ApiSwitchResponse {
  message: string;
  user: {
    id: number;
    prefixed_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
  };
  token: string;
}

export interface SwitchResult {
  user: {
    id: string;
    prefixedId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
  };
  token: string;
}

/**
 * Switch to a child account
 * @param childId - The ID of the child to switch to
 * @param deviceName - Optional device name for the token
 */
export const switchToChild = async (
  childId: string,
  deviceName?: string
): Promise<SwitchResult> => {
  const response = await api.post<ApiSwitchResponse>(ENDPOINTS.USERS.SWITCH_TO_CHILD(childId), {
    device_name: deviceName,
  });

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to switch to child account');
  }

  const { user, token } = response.data;

  return {
    user: {
      id: String(user.id),
      prefixedId: user.prefixed_id,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: user.full_name,
      email: user.email,
    },
    token,
  };
};
