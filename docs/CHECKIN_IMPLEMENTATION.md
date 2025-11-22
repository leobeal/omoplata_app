# QR Code Check-in Implementation Guide

## Overview

The Omoplata fitness club app uses QR code scanning for member check-ins. This document outlines the architecture, implementation approach, and security considerations.

## Architecture

### Current QR Code Format (HTTP Link)
Currently, QR codes contain HTTP links like:
```
https://gym.example.com/checkin?code=MEMBER_ID_TOKEN
```

**Problems with HTTP links:**
- Opens in browser instead of app
- Security risk: tokens exposed in URL
- Poor user experience (manual copying)
- No control over expiration

### Recommended QR Code Format (JSON Payload)

**Option 1: Encrypted JSON String**
```json
{
  "type": "gym_checkin",
  "facility_id": "evolve_downtown",
  "timestamp": 1700000000,
  "nonce": "random_string"
}
```
Encrypted and base64 encoded to prevent tampering.

**Option 2: Signed Token (JWT-like)**
```
gym://checkin/eyJhbGc...signature
```
Custom URL scheme with signed token for security.

**Option 3: Simple Code (Recommended for MVP)**
```
{
  "type": "gym_checkin",
  "facility_id": "evolve_downtown",
  "code": "ABC123XYZ"
}
```
Backend validates the code and checks:
- Code is valid and not expired
- Code belongs to the correct facility
- Code hasn't been used already (if single-use)

## Implementation Flow

### 1. Member Opens Check-in
```
User taps Check-in button
  ↓
App requests camera permissions
  ↓
Camera view opens with QR scanner overlay
```

### 2. QR Code Scan
```
Camera detects QR code
  ↓
Parse QR code data (JSON or string)
  ↓
Validate format locally
  ↓
Show loading indicator
```

### 3. Backend Validation
```
Send check-in request to API
POST /checkin/scan
{
  "code": "ABC123XYZ",
  "facility_id": "evolve_downtown",
  "latitude": 40.7128,    // Optional: verify location
  "longitude": -74.0060,
  "timestamp": 1700000000
}
  ↓
Backend validates:
  - User is authenticated
  - Code is valid
  - User has active membership
  - User hasn't checked in recently (prevent duplicates)
  - Location is within facility radius (optional)
  ↓
Return success or error
```

### 4. Success Response
```json
{
  "success": true,
  "checkin_id": "ci_123456",
  "timestamp": "2024-11-21T10:30:00Z",
  "facility": "Evolve Downtown",
  "message": "Welcome back, John!",
  "streak": 5
}
```

### 5. Error Responses
```json
{
  "success": false,
  "error": "invalid_code",
  "message": "This QR code is not valid"
}

{
  "success": false,
  "error": "already_checked_in",
  "message": "You're already checked in today"
}

{
  "success": false,
  "error": "membership_inactive",
  "message": "Your membership is inactive. Please contact the front desk."
}
```

## Technical Implementation

### Dependencies
```json
{
  "expo-camera": "~15.0.0",
  "expo-barcode-scanner": "~14.0.0"  // Alternative
}
```

### Camera Permissions
```typescript
import { Camera } from 'expo-camera';

const [permission, requestPermission] = Camera.useCameraPermissions();

if (!permission?.granted) {
  // Show permission request UI
  await requestPermission();
}
```

### QR Code Scanning
```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';

<CameraView
  style={StyleSheet.absoluteFill}
  facing="back"
  onBarcodeScanned={handleBarCodeScanned}
  barcodeScannerSettings={{
    barcodeTypes: ['qr'],
  }}
>
  {/* Overlay UI */}
</CameraView>
```

### Parse and Validate QR Data
```typescript
const handleBarCodeScanned = ({ data }: BarCodeEvent) => {
  try {
    // Try parsing as JSON
    const qrData = JSON.parse(data);

    // Validate format
    if (qrData.type !== 'gym_checkin') {
      throw new Error('Invalid QR code type');
    }

    // Send to backend
    performCheckin(qrData);
  } catch (error) {
    // Handle HTTP link format (fallback)
    if (data.startsWith('http')) {
      extractCodeFromUrl(data);
    } else {
      showError('Invalid QR code');
    }
  }
};
```

## UI/UX Considerations

### Camera View
- Full-screen camera view
- Semi-transparent overlay with cutout for QR code
- Instructions: "Point camera at QR code"
- Close button (X) in top corner
- Flashlight toggle for low light

### Scanning States
1. **Idle**: Show scanning frame, waiting for QR code
2. **Scanning**: QR code detected, show loading spinner
3. **Success**: Show checkmark animation, success message
4. **Error**: Show error message, retry button

### Success Animation
```
✓ Checkmark animation
"Welcome back, John!"
"Check-in #45 this month"
"Keep up the streak!"
Auto-close after 2 seconds
```

### Error Handling
```
❌ Error icon
"Membership Inactive"
"Please contact the front desk"
[Close] [Contact Support] buttons
```

## Security Considerations

### 1. Code Generation (Backend)
- Generate unique codes per facility
- Include timestamp to prevent replay attacks
- Set expiration (e.g., code valid for 60 seconds)
- Use cryptographic signing

### 2. Code Validation (Backend)
- Verify signature/encryption
- Check timestamp (not expired, not too far in future)
- Check code hasn't been used (single-use codes)
- Verify user's membership status
- Rate limit check-in attempts

### 3. Mobile App
- Don't store QR code data
- Use HTTPS for all API calls
- Include auth token in API requests
- Validate QR code format before sending

### 4. Location Validation (Optional)
- Check GPS coordinates match facility location
- Allow radius of ~100-200 meters
- Fallback: show warning but allow check-in

## Backend API Integration

### Endpoint: POST /checkin/scan
```typescript
interface CheckinRequest {
  code: string;
  facility_id: string;
  latitude?: number;
  longitude?: number;
  timestamp: number;
}

interface CheckinResponse {
  success: boolean;
  checkin_id?: string;
  timestamp?: string;
  facility?: string;
  message?: string;
  streak?: number;
  error?: string;
}
```

See `backend_apis/CHECKIN.md` for full API documentation.

## Migration Strategy

### Phase 1: Support Both Formats (Current)
- Parse HTTP links (extract code from URL)
- Parse JSON QR codes
- Send both formats to backend

### Phase 2: Generate New QR Codes (Backend)
- Backend generates JSON QR codes
- Old HTTP links still work for compatibility
- Print new QR codes at facilities

### Phase 3: Deprecate HTTP Links
- Remove HTTP link support from app
- All facilities using new QR codes

## Testing Checklist

- [ ] Camera permissions granted/denied
- [ ] Scan valid QR code (JSON format)
- [ ] Scan valid QR code (HTTP format)
- [ ] Scan invalid QR code
- [ ] Network error during check-in
- [ ] Already checked in error
- [ ] Inactive membership error
- [ ] Success animation displays
- [ ] Streak counter updates
- [ ] Close button works
- [ ] Flashlight toggle works
- [ ] Low light conditions
- [ ] Multiple rapid scans (debouncing)

## Future Enhancements

1. **Offline Check-in Queue**
   - Store check-ins when offline
   - Sync when connection restored

2. **Class Check-in**
   - Different QR codes for specific classes
   - Automatically add to class roster

3. **Guest Check-in**
   - Member scans guest pass QR code
   - Guest fills out waiver form

4. **Analytics**
   - Track peak check-in times
   - Popular facilities
   - Member retention metrics

## Files to Create/Modify

### New Files
- `app/screens/checkin.tsx` - Main check-in screen
- `components/QRScanner.tsx` - Reusable QR scanner component
- `api/checkin.ts` - Check-in API client
- `utils/qr-validator.ts` - QR code validation helpers

### Modified Files
- `components/CheckInButton.tsx` - Navigate to check-in screen
- `package.json` - Add expo-camera dependency
- `app.json` - Add camera permissions

### API Files
- `backend_apis/CHECKIN.md` - Already exists, may need updates
