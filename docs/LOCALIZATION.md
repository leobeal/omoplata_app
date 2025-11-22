# Localization Guide

## Overview

The Omoplata app supports multiple languages through a centralized localization system using `i18n-js`. The app automatically loads the correct language based on tenant configuration.

## Supported Languages

- **English (en)** - Default fallback language
- **German (de)** - Set for both Evolve and Sparta tenants
- **Portuguese Brazil (pt-BR)** - Available for configuration

## Configuration

### Setting Tenant Language

Edit the tenant configuration file in `configs/[tenant].js`:

```javascript
module.exports = {
  // ... other config
  language: 'de', // de, en, or pt-BR
};
```

### Current Tenant Languages

- **Evolve**: German (de)
- **Sparta**: German (de)

## Usage in Components

### Import the translation hook

```typescript
import { useT } from '@/contexts/LocalizationContext';
```

### Use in components

```typescript
export default function MyComponent() {
  const t = useT();

  return (
    <ThemedText>{t('common.welcome')}</ThemedText>
  );
}
```

### With parameters

```typescript
// Translation: "Welcome back, {{name}}!"
<ThemedText>{t('home.welcomeBack', { name: 'John' })}</ThemedText>
```

## Translation Structure

Translations are organized by feature area:

```
locales/
├── en.ts          # English translations
├── de.ts          # German translations
├── pt-BR.ts       # Portuguese (Brazil) translations
└── index.ts       # Exports all translations
```

### Translation Keys

```typescript
{
  nav: {
    dashboard: 'Dashboard',
    checkin: 'Check-in',
    settings: 'Settings',
  },

  common: {
    close: 'Close',
    back: 'Back',
    // ...
  },

  home: {
    welcomeBack: 'Welcome back!',
    // ...
  },

  settings: {
    title: 'Settings',
    // ...
  },

  memberships: {
    title: 'Membership Plans',
    // ...
  },

  checkin: {
    title: 'Scan QR Code',
    // ...
  },

  login: {
    title: 'Login',
    // ...
  },

  date: {
    monday: 'Monday',
    // ...
  },
}
```

## Adding New Translations

### 1. Add to English (en.ts)

```typescript
export default {
  myFeature: {
    title: 'My Feature',
    description: 'Feature description',
  },
};
```

### 2. Add to German (de.ts)

```typescript
export default {
  myFeature: {
    title: 'Meine Funktion',
    description: 'Funktionsbeschreibung',
  },
};
```

### 3. Add to Portuguese (pt-BR.ts)

```typescript
export default {
  myFeature: {
    title: 'Minha Funcionalidade',
    description: 'Descrição da funcionalidade',
  },
};
```

## Best Practices

### 1. Always use translation keys

❌ **Bad:**
```typescript
<ThemedText>Welcome back!</ThemedText>
```

✅ **Good:**
```typescript
<ThemedText>{t('home.welcomeBack')}</ThemedText>
```

### 2. Use parameters for dynamic content

❌ **Bad:**
```typescript
<ThemedText>Check-in #{count} this month</ThemedText>
```

✅ **Good:**
```typescript
<ThemedText>{t('checkin.checkInNumber', { count })}</ThemedText>
```

### 3. Group related translations

✅ **Good structure:**
```typescript
{
  checkin: {
    title: 'Scan QR Code',
    success: 'Check-in Success!',
    error: 'Check-in failed',
  }
}
```

### 4. Keep translations consistent

Use the same terminology across all screens:
- "Settings" vs "Configuration"
- "Dashboard" vs "Home"
- "Check-in" vs "Check in"

### 5. Consider context

Some words have different translations based on context:
- "Classes" (lessons) vs "Classes" (CSS)
- "Settings" (preferences) vs "Setting" (configuration value)

## Testing Translations

### 1. Change tenant language

Edit `configs/[tenant].js`:
```javascript
language: 'pt-BR', // Test Portuguese
```

### 2. Restart the app

```bash
TENANT=evolve npm start
```

### 3. Verify all screens

- Navigate through all screens
- Check for missing translations (will show key instead of text)
- Verify text fits in UI components

## Common Issues

### Missing Translation Key

If a translation key is missing, the app will:
1. Try to find it in the current language
2. Fall back to English (default locale)
3. Return the key itself if not found anywhere

Example:
```typescript
t('nonexistent.key') // Returns: "nonexistent.key"
```

### Special Characters

Escape special characters in translations:
```typescript
{
  message: "Don't forget to check-in!",  // ✅ Good
  message: 'Don\'t forget to check-in!', // ✅ Also works
}
```

### Pluralization

For now, handle pluralization manually:
```typescript
const classesText = count === 1
  ? t('home.class')
  : t('home.classes');
```

## Future Enhancements

- [ ] Date/time localization with locale-specific formats
- [ ] Number formatting (1,000 vs 1.000)
- [ ] Currency formatting ($ vs € vs R$)
- [ ] RTL language support
- [ ] Pluralization rules per language
- [ ] Language selector in Settings
- [ ] String interpolation with formatting
- [ ] Translation validation tests

## Resources

- [i18n-js Documentation](https://github.com/fnando/i18n-js)
- [Expo Localization](https://docs.expo.dev/versions/latest/sdk/localization/)
- [Unicode CLDR](https://cldr.unicode.org/) - Locale data
