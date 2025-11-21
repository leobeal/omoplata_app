# Omoplata App - Claude Development Guide

## Project Overview

Omoplata is a multi-tenant fitness club management mobile application built with React Native and Expo. The app supports multiple gym/fitness club brands with configurable theming, localization, and navigation.

## Tech Stack

- **Framework**: React Native with Expo (SDK 52)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: React hooks (useState, useEffect, useContext)
- **Icons**: lucide-react-native
- **Internationalization**: i18n-js
- **Testing**: Jest + React Native Testing Library

## Project Structure

```
omoplata_app/
├── api/                    # API modules with mock data
│   ├── classes.ts         # Class schedule and attendance
│   ├── invoices.ts        # Billing and invoices
│   ├── membership.ts      # Membership contracts
│   └── profile.ts         # User profile management
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Bottom tab navigation screens
│   │   ├── index.tsx      # Dashboard
│   │   ├── billing.tsx    # Billing/Invoices
│   │   ├── membership.tsx # Membership details
│   │   └── settings.tsx   # Settings
│   ├── screens/           # Secondary screens
│   │   ├── edit-profile.tsx
│   │   ├── invoice-detail.tsx
│   │   ├── memberships.tsx (plan details)
│   │   └── plans.tsx (plan comparison)
│   └── _layout.tsx
├── components/            # Reusable UI components
│   ├── ClassCard.tsx     # Class attendance card
│   ├── Header.tsx
│   ├── Icon.tsx
│   ├── ThemeToggle.tsx
│   └── ...
├── configs/               # Tenant configurations
│   ├── navigation.ts     # Default navigation config
│   ├── evolve.js         # Evolve gym config
│   └── sparta.js         # Sparta gym config
├── contexts/              # React contexts
│   ├── ThemeContext.tsx
│   ├── ThemeColors.tsx
│   └── LocalizationContext.tsx
├── data/                  # Mock JSON data
│   ├── classes.json
│   ├── invoices.json
│   ├── membership.json
│   └── profile.json
├── locales/              # Translation files
│   ├── en.ts            # English
│   ├── pt-BR.ts         # Portuguese (Brazil)
│   ├── de.ts            # German
│   └── index.ts
└── utils/

## Multi-Tenancy System

### Tenant Configuration

Each tenant (gym/fitness club) has its own configuration file in `configs/`:

```javascript
module.exports = {
  // App identity
  name: 'Evolve',
  slug: 'evolve',
  bundleIdentifier: 'com.anonymous.evolve',

  // Theme colors
  theme: {
    primary: '#4CAF50',
    secondary: '#8BC34A',
    background: '#ffffff',
    text: '#333333',
  },

  // Localization
  language: 'de', // de, en, pt-BR

  // Bottom navigation tabs
  navigation: {
    tabs: [
      { name: 'index', icon: 'Home', label: 'nav.dashboard', href: '/' },
      { name: 'membership', icon: 'Award', label: 'nav.membership', href: '/membership' },
      { name: 'settings', icon: 'Settings', label: 'nav.settings', href: '/settings' },
    ],
    showCheckInButton: true,
  },
};
```

### Switching Tenants

To switch between tenants:
```bash
TENANT=evolve npx expo start
# or
TENANT=sparta npx expo start
```

## Key Features

### 1. Dashboard (Home Screen)
- Welcome message with dynamic greeting
- Membership status overview
- Activity statistics (classes, check-ins, goals)
- **Upcoming Classes** section with:
  - Next 3 upcoming classes
  - Confirm/Deny attendance buttons
  - Status badges (Pending, Confirmed, Declined)
  - Class details: instructor, time, location, enrollment

### 2. Membership Page
- Current plan information
- Contract details (start, end, renewal dates)
- Pricing (annual fee, monthly equivalent)
- Plan features with limits
- Payment method (SEPA Direct Debit)
- Membership policies
- Download contract PDF button

### 3. Billing Page
- **Next Invoice card** (replaces summary stats)
- Recent invoices list
- Invoice status badges (Paid, Pending, Overdue)
- Payment method: SEPA Direct Debit with IBAN
- Click invoice to see detailed view

### 4. Invoice Detail
- Invoice number and status
- Line items breakdown
- Subtotal, tax, total
- Payment method and IBAN details
- Billing information
- Download PDF / Pay Now buttons

### 5. Edit Profile
- Personal information (name, phone)
- Address management
- Emergency contact
- Form validation
- Save/Cancel actions

### 6. Settings
- User profile card
- Theme toggle (dark/light mode)
- Navigation to:
  - Edit Profile
  - Membership details
  - Notifications
  - Help & Support
  - Logout

## Localization

### Adding New Translations

1. Add translation keys to all language files (`locales/en.ts`, `locales/pt-BR.ts`, `locales/de.ts`)
2. Use the `useT()` hook in components:

```typescript
import { useT } from '@/contexts/LocalizationContext';

const MyComponent = () => {
  const t = useT();

  return (
    <ThemedText>{t('membership.title')}</ThemedText>
  );
};
```

### Translation Structure

```typescript
{
  nav: { ... },           // Navigation labels
  common: { ... },        // Common buttons/actions
  home: { ... },          // Dashboard screen
  settings: { ... },      // Settings screen
  membership: { ... },    // Membership screen
  memberships: { ... },   // Plans screen
  checkin: { ... },       // Check-in screen
  login: { ... },         // Login screen
  date: { ... },          // Date/time labels
}
```

## Styling Guidelines

### Using NativeWind

The app uses NativeWind for styling with Tailwind CSS classes:

```tsx
<View className="flex-1 bg-background">
  <ThemedText className="text-2xl font-bold">Title</ThemedText>
</View>
```

### Theme Colors

Access theme colors via context:
```typescript
const colors = useThemeColors();
<View style={{ backgroundColor: colors.bg }} />
```

## Navigation

### Configurable Bottom Navigation

Navigation tabs are configured per tenant in `configs/{tenant}.js`:

- **Tabs**: Array of navigation items
- **showCheckInButton**: Toggle check-in button visibility
- Falls back to `configs/navigation.ts` if not specified

### Adding New Tabs

1. Create page in `app/(tabs)/` directory
2. Add tab configuration to tenant config
3. Add translation keys to all language files

## Data Management

### Mock Data Pattern

All data is stored in `data/*.json` files and accessed via API modules in `api/`:

```typescript
// api/example.ts
import data from '@/data/example.json';

export const getData = async (): Promise<DataType[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate delay
  return data as DataType[];
};
```

### API Modules

- `api/classes.ts` - Class schedules, attendance management
- `api/invoices.ts` - Invoices, billing data
- `api/membership.ts` - Membership contracts
- `api/profile.ts` - User profile operations

## Component Guidelines

### Themed Components

Always use themed components for consistent styling:

- `ThemedText` - Text with theme colors
- `ThemedScroller` - ScrollView with theme background
- `Header` - Page header with back button
- `Section` - Section title component
- `Icon` - lucide-react-native icons
- `Button` - Styled button component

### Creating New Components

```typescript
import React from 'react';
import { View } from 'react-native';
import ThemedText from '@/components/ThemedText';
import { useThemeColors } from '@/contexts/ThemeColors';

interface MyComponentProps {
  title: string;
}

export default function MyComponent({ title }: MyComponentProps) {
  const colors = useThemeColors();

  return (
    <View className="rounded-2xl bg-secondary p-5">
      <ThemedText className="text-lg font-bold">{title}</ThemedText>
    </View>
  );
}
```

## Testing

### Running Tests

```bash
npm test
# or
npm run test:watch
```

### Test Structure

Tests are located next to their components with `.test.tsx` extension:
```
components/
├── MyComponent.tsx
└── MyComponent.test.tsx
```

## Common Patterns

### Loading States

```typescript
const [loading, setLoading] = useState(true);

if (loading) {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" />
    </View>
  );
}
```

### Error Handling

```typescript
try {
  const data = await apiCall();
  setData(data);
} catch (error) {
  console.error('Error:', error);
  Alert.alert('Error', 'Failed to load data');
}
```

### Date Formatting

```typescript
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};
```

## Development Workflow

### Starting Development Server

```bash
# Default tenant
npx expo start

# Specific tenant
TENANT=evolve npx expo start
TENANT=sparta npx expo start
```

### Building the App

```bash
# Development build
npx expo run:ios
npx expo run:android

# Production build
eas build --platform all
```

## Git Workflow

### Committing Changes

- Always stage and commit changes with descriptive messages
- Push to the designated feature branch
- Follow the format:
  ```
  <verb> <what> <details>

  - Bullet point 1
  - Bullet point 2
  ```

### Branch Naming

Use Claude-generated branches: `claude/<task-description>-<session-id>`

## Adding New Features

### Checklist for New Features

1. ✅ Create dummy data in `data/*.json`
2. ✅ Create API module in `api/*.ts`
3. ✅ Create page/component
4. ✅ Add translations to ALL language files
5. ✅ Update navigation if needed
6. ✅ Add to both tenant configs
7. ✅ Test with different tenants
8. ✅ Write tests
9. ✅ Commit and push

## Troubleshooting

### Common Issues

**Issue**: Changes not reflecting
- **Solution**: Clear Metro bundler cache: `npx expo start -c`

**Issue**: Theme not working
- **Solution**: Ensure `ThemeProvider` wraps the app in `_layout.tsx`

**Issue**: Translations not loading
- **Solution**: Check translation keys exist in all language files

**Issue**: Navigation not showing new tab
- **Solution**: Verify tab config in both default and tenant configs

## Best Practices

1. **Always translate text** - Use `t()` function for all user-facing text
2. **Use themed components** - Maintain consistent styling
3. **Handle loading states** - Show ActivityIndicator during data fetches
4. **Validate user input** - Check form fields before submission
5. **Test on multiple tenants** - Verify features work for all configurations
6. **Mock API delays** - Simulate real network conditions (300-500ms)
7. **Follow naming conventions** - Use clear, descriptive names
8. **Document complex logic** - Add comments for non-obvious code

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Lucide Icons](https://lucide.dev/)

## Support

For questions or issues:
- Check this documentation first
- Review existing code patterns
- Test with multiple tenants
- Verify translations are complete
