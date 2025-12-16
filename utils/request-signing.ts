/**
 * Request Signing Utility
 *
 * Generates HMAC-SHA256 signatures for API requests to prevent
 * token misuse outside the mobile app.
 *
 * The signature is computed as:
 * HMAC-SHA256(timestamp + "\n" + method + "\n" + path + "\n" + bodyHash, secret)
 */

import CryptoJS from 'crypto-js';
import Constants from 'expo-constants';

// Signing secret - should match backend's API_SIGNING_SECRET
// Loaded via expo-constants from app.config.js extra
const SIGNING_SECRET = Constants.expoConfig?.extra?.apiSigningSecret || 'your-signing-secret-here';

export interface SignatureHeaders {
  'X-Timestamp': string;
  'X-Signature': string;
}

/**
 * Generate signature headers for an API request
 *
 * @param method - HTTP method (GET, POST, etc.)
 * @param path - Request path (e.g., /api/v1/users)
 * @param body - Request body (optional)
 * @returns Headers object with X-Timestamp and X-Signature
 */
export function generateSignatureHeaders(
  method: string,
  path: string,
  body?: Record<string, unknown> | string | null
): SignatureHeaders {
  // Current Unix timestamp in seconds
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Hash the body (empty string if no body)
  const bodyString = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
  const bodyHash = CryptoJS.SHA256(bodyString).toString(CryptoJS.enc.Hex);

  // Build the string to sign
  // Format: timestamp\nMETHOD\n/path\nbodyHash
  const stringToSign = [timestamp, method.toUpperCase(), path, bodyHash].join('\n');

  // Generate HMAC-SHA256 signature
  const signature = CryptoJS.HmacSHA256(stringToSign, SIGNING_SECRET).toString(CryptoJS.enc.Hex);

  return {
    'X-Timestamp': timestamp,
    'X-Signature': signature,
  };
}

/**
 * Extract the path from a full URL or endpoint
 * Handles both full URLs and relative paths
 */
export function extractPath(urlOrPath: string): string {
  try {
    // If it's a full URL, extract just the path
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      const url = new URL(urlOrPath);
      return url.pathname;
    }
    // Already a path, ensure it starts with /
    return urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  } catch {
    // If URL parsing fails, return as-is with leading slash
    return urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  }
}
