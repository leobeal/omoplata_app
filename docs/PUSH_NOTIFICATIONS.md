# Push Notifications

Push notifications are implemented using **Expo Push Notifications** with **EAS Build**.

## Multi-Tenant Behavior

Each tenant app (built with `TENANT=<slug>`) gets its own:
- EAS project ID (from `configs/<tenant>.js`)
- Push credentials (APNs for iOS, FCM for Android) - managed automatically by EAS
- Push tokens are registered per-tenant via the `X-Tenant` header
- Notification icon (optional, falls back to global)

When a user logs in, the app automatically registers the push token with the backend for that tenant.

## App-Side Files

| File | Purpose |
|------|---------|
| `utils/push-notifications.ts` | Token management and permissions |
| `contexts/NotificationContext.tsx` | Auto-registration on login/logout |
| `app.config.js` | Plugin config (icon uses tenant's primary color) |

## Flow

1. User logs in → app requests permission → gets Expo Push Token
2. Token sent to backend: `POST /api/push/register` with `X-Tenant` header
3. User logs out → `POST /api/push/unregister`
4. Tenant switch → token re-registered for new tenant

## Backend Endpoints Required

**Register**: `POST /api/push/register`
```json
{ "token": "ExponentPushToken[xxx]", "platform": "ios", "deviceName": "iPhone" }
```

**Unregister**: `POST /api/push/unregister`
```json
{ "token": "ExponentPushToken[xxx]" }
```

## Sending Notifications

Use Expo Push API: `POST https://exp.host/--/api/v2/push/send`

See: https://docs.expo.dev/push-notifications/sending-notifications/

## Notification Icon

Android requires a notification icon (96x96 PNG, white on transparent).

**Global fallback**: `assets/_global/notification-icon.png`

**Per-tenant**: Add `notificationIcon` to tenant config:
```javascript
// configs/my-tenant.js
module.exports = {
  // ...
  notificationIcon: './assets/my-tenant/notification-icon.png',
};
```

## Setup Checklist

- [ ] Create `assets/_global/notification-icon.png` (96x96, white on transparent)
- [ ] (Optional) Create tenant-specific icons and add `notificationIcon` to tenant config
- [ ] Implement backend endpoints
- [ ] Run `eas build` (creates push credentials automatically)
- [ ] Test on physical device (simulators don't support push)

## Resources

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/)
