# Onboarding

Omoplata tracks two types of onboarding: **User Onboarding** and **Membership Onboarding**. Understanding the distinction is critical for working with the system correctly.

## User Onboarding vs Membership Onboarding

### User Onboarding (`user_onboardings`)
Tracks a **user's account setup** in the system. Created once per user when they first register, regardless of how many memberships they may have.

**Key fields:**
- `source` - How the user was created (`STATION` or `MEMBER_DEVICE`)
- `payment_terms` - When user accepted payment/SEPA terms (marks onboarding as complete)
- `welcome_email_sent_at` - Timestamp of welcome email delivery
- `legacy_*` fields - Deprecated fields from old single-membership approach

**Purpose:** Tracks whether a user has completed their initial account setup and accepted payment terms.

**Check if user onboarded:**
```php
$user->isOnboarded(); // Returns true if payment_terms is set
```

### Membership Onboarding (`membership_onboardings`)
Tracks the **onboarding process for a specific membership**. A user can have multiple memberships, each with its own onboarding record.

**Key fields:**
- `membership_id` - Which membership this onboarding belongs to
- `source` - How this membership was created (`STATION` or `MEMBER_DEVICE`)
- `contract_path` - Path to signed contract PDF
- `terms_accepted_at` - When member signed the membership contract
- `started_at` - When member began the onboarding flow
- `completed_at` - When all onboarding steps finished

**Purpose:** Tracks contract signing and completion status for individual memberships.

**Check if membership onboarded:**
```php
$membership->onboarding->isCompleted(); // Checks completed_at, terms_accepted_at, and contract_path
```

## Onboarding Sources

The `OnboardingSource` enum tracks where a user/membership was created:

- `STATION` - Created at gym kiosk/tablet
- `MEMBER_DEVICE` - Created by member via portal welcome page

This helps clubs understand how members prefer to sign up.

## Portal Onboarding Flow

The member onboarding flow in the portal consists of several steps:

1. **Welcome Page** (`portal.welcome`)
   - New user registers with basic info
   - Creates `User` record
   - Creates `UserOnboarding` with `source = MEMBER_DEVICE`

2. **Membership Selection** (`portal.onboarding.membership`)
   - Choose plan and pricing
   - Creates `Membership` record
   - Creates `MembershipOnboarding` with `started_at = now()`

3. **Terms & Contract** (`portal.onboarding.terms`)
   - Member reviews and signs contract
   - Generates PDF with signature and club logo
   - Saves to `contracts/` directory
   - Updates `MembershipOnboarding` with `contract_path` and `terms_accepted_at`

4. **Payment Setup** (`portal.onboarding.payment`)
   - Configure payment method (SEPA, credit card, manual)
   - Accept payment terms
   - Updates `UserOnboarding` with `payment_terms = now()` (marks user as fully onboarded)

5. **Medical Questions** (`portal.onboarding.medical-questions`)
   - Optional health questionnaire
   - Stored as user metadata

6. **Profile Picture** (`portal.onboarding.profile-picture`)
   - Optional photo upload

7. **Completion** (`portal.onboarding.completed`)
   - Updates `MembershipOnboarding` with `completed_at = now()`
   - Redirects to portal dashboard

## Contract PDF Generation

When members accept terms during onboarding, a PDF is generated containing:
- Contract title and full text
- Club logo (embedded as base64 to avoid path issues with dompdf)
- Member signature
- Member name and acceptance date/time
- For minors: responsible person's name with note indicating child's name

**File naming:** `{contract-title-slug}-{timestamp}.pdf`

**Storage location:** `contracts/` directory in tenant storage

**Database tracking:** `contract_path` saved in `membership_onboardings` table

The `pdf.contract` view is used for rendering and can be tested directly without parsing the final PDF.

## Messaging Context

When working on portal or onboarding features, always consider the **audience**:

- **Member messages** - Address the person creating the account
- **Responsible messages** - Address parents/guardians making choices for their child

Example: A responsible chooses "sports their child trains," not "sports they personally practice." Mixing perspectives creates confusion.

## Key Relationships

```php
// User has one UserOnboarding
$user->onboarding; // UserOnboarding

// User has many Memberships (through pivot)
$user->memberships; // Collection<Membership>

// Membership has one MembershipOnboarding
$membership->onboarding; // MembershipOnboarding

// Access contract path for user's first membership
$user->memberships()->first()?->onboarding?->contract_path;
```

## Important Notes

1. **User onboarding completes when `payment_terms` is set** - this is the definitive check via `$user->isOnboarded()`

2. **Membership onboarding completes when all three exist:**
   - `completed_at` timestamp
   - `terms_accepted_at` timestamp
   - `contract_path` file path

3. **Legacy fields exist for backward compatibility** - `contract_path`, `terms_accepted_at`, `membership_starts_at` in `user_onboardings` should not be used for new features

4. **Welcome emails reference membership contracts** - The `WelcomeNewMembersNotification` looks for contracts in `membership_onboardings`, not `user_onboardings`

5. **A user can have multiple incomplete membership onboardings** - Users might start onboarding for different plans or abandon the process

## Common Operations

### Create user with onboarding
```php
$user = User::factory()->create();
$user->onboarding()->create([
    'source' => OnboardingSource::MEMBER_DEVICE,
]);
```

### Create membership with onboarding
```php
$membership = Membership::factory()->create();
$membership->members()->attach($user->id, ['role' => MembershipRole::MEMBER]);
$membership->onboarding()->create([
    'source' => OnboardingSource::MEMBER_DEVICE,
    'started_at' => now(),
]);
```

### Mark onboarding steps complete
```php
// When contract signed
$membership->onboarding->update([
    'contract_path' => 'contracts/contract-123.pdf',
    'terms_accepted_at' => now(),
]);

// When payment configured
$user->onboarding->update([
    'payment_terms' => now(),
]);

// When all steps finished
$membership->onboarding->markAsCompleted(); // Sets completed_at
```

### Check onboarding status
```php
// User completed account setup?
if ($user->isOnboarded()) {
    // payment_terms is set
}

// Membership fully onboarded?
if ($membership->onboarding?->isCompleted()) {
    // Has completed_at, terms_accepted_at, and contract_path
}
```
