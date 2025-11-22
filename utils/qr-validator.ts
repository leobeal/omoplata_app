/**
 * QR Code Validation Utilities
 * Handles parsing and validation of QR codes for gym check-in
 */

export interface QRCodeData {
  type: 'gym_checkin';
  facility_id?: string;
  code?: string;
  timestamp?: number;
  locationId?: string;
}

export interface QRValidationResult {
  valid: boolean;
  data?: QRCodeData;
  error?: string;
}

/**
 * Parse QR code data from various formats
 */
export function parseQRCode(rawData: string): QRValidationResult {
  try {
    // Try parsing as JSON
    const parsed = JSON.parse(rawData);

    if (parsed.type === 'gym_checkin') {
      return {
        valid: true,
        data: parsed as QRCodeData,
      };
    }

    return {
      valid: false,
      error: 'Invalid QR code type',
    };
  } catch {
    // Not JSON, try parsing as HTTP link
    if (rawData.startsWith('http://') || rawData.startsWith('https://')) {
      return parseHTTPLink(rawData);
    }

    // Try parsing as simple code
    if (/^[A-Z0-9-]+$/.test(rawData)) {
      return {
        valid: true,
        data: {
          type: 'gym_checkin',
          code: rawData,
        },
      };
    }

    return {
      valid: false,
      error: 'Unrecognized QR code format',
    };
  }
}

/**
 * Parse HTTP link format (legacy)
 * Example: https://gym.example.com/checkin?code=ABC123&location=downtown
 */
function parseHTTPLink(url: string): QRValidationResult {
  try {
    const urlObj = new URL(url);

    // Extract code from query parameters
    const code = urlObj.searchParams.get('code');
    const locationId = urlObj.searchParams.get('location') || urlObj.searchParams.get('locationId');

    if (!code) {
      return {
        valid: false,
        error: 'Missing check-in code in URL',
      };
    }

    return {
      valid: true,
      data: {
        type: 'gym_checkin',
        code,
        locationId: locationId || undefined,
      },
    };
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Validate QR code data before sending to backend
 */
export function validateQRData(data: QRCodeData): QRValidationResult {
  // Check type
  if (data.type !== 'gym_checkin') {
    return {
      valid: false,
      error: 'Invalid QR code type',
    };
  }

  // Check required fields
  if (!data.code && !data.facility_id) {
    return {
      valid: false,
      error: 'Missing check-in code or facility ID',
    };
  }

  // Check timestamp (if present)
  if (data.timestamp) {
    const now = Date.now() / 1000;
    const age = now - data.timestamp;

    // Reject if older than 5 minutes
    if (age > 300) {
      return {
        valid: false,
        error: 'QR code has expired',
      };
    }

    // Reject if timestamp is in future
    if (age < -60) {
      return {
        valid: false,
        error: 'Invalid QR code timestamp',
      };
    }
  }

  return {
    valid: true,
    data,
  };
}

/**
 * Extract location ID from QR data or fallback to default
 */
export function extractLocationId(data: QRCodeData, defaultLocationId?: string): string {
  return data.locationId || data.facility_id || defaultLocationId || 'loc_001';
}

/**
 * Extract check-in code from QR data
 */
export function extractCheckinCode(data: QRCodeData): string | undefined {
  return data.code;
}

/**
 * Format QR data for API request
 */
export function formatCheckinRequest(data: QRCodeData): {
  method: 'qr_code';
  locationId: string;
  qrCode: string;
} {
  const code = extractCheckinCode(data);
  const locationId = extractLocationId(data);

  if (!code) {
    throw new Error('No check-in code found in QR data');
  }

  return {
    method: 'qr_code',
    locationId,
    qrCode: code,
  };
}
