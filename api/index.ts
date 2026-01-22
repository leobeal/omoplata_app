// API Module Entry Point
// Export all API services and utilities

export { API_CONFIG, ENDPOINTS } from './config';
export { api, apiRequest, setAuthToken, getAuthToken } from './client';
export { authApi } from './auth';
export { otpApi, requestOtp, verifyOtp } from './otp';
export type { VerifyOtpUser, VerifyOtpResponse, OtpError } from './otp';
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from './auth';
export { checkinApi, transformNoClassesData } from './checkin';
export type {
  CheckinRequest,
  CheckinResponse,
  CheckinHistoryResponse,
  CheckinStatsResponse,
  ActiveCheckinResponse,
  CheckinVenue,
  CheckinFacility,
  CheckinData,
  NoClassesAvailableData,
} from './checkin';
