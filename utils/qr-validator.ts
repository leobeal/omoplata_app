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

    // Extract optional parameters from query parameters
    const code = urlObj.searchParams.get('code');
    const locationId = urlObj.searchParams.get('location') || urlObj.searchParams.get('locationId');
    const facilityId =
      urlObj.searchParams.get('facility_id') || urlObj.searchParams.get('facilityId');

    return {
      valid: true,
      data: {
        type: 'gym_checkin',
        code: code || undefined,
        locationId: locationId || undefined,
        facility_id: facilityId || undefined,
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

  // All gym_checkin QR codes are valid
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

  return {
    method: 'qr_code',
    locationId,
    qrCode: code || '',
  };
}
