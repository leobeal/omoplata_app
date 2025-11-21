# Membership Pauses

Membership pauses allow members to temporarily suspend their membership for a specified period. This document details how pauses work, their impact on billing and contracts, and technical implementation details.

## Overview

A membership pause is a time period during which:
- The member's access may be restricted (implementation-dependent)
- Billing charges are skipped
- The membership status changes to `PAUSED`
- Optionally, the contract end date can be extended

## Database Schema

### MembershipPause Model

Located at `app/Models/MembershipPause.php`

**Fields:**
- `id` - Primary key
- `membership_id` - Foreign key to memberships table
- `starts_at` - Date when pause begins (DATE, not DATETIME)
- `ends_at` - Date when pause ends (nullable for indefinite pauses)
- `reason` - Optional text explanation for the pause
- `extends_contract` - Boolean flag to extend contract by pause duration
- `created_at` / `updated_at` - Timestamps

**Methods:**
- `isActive()` - Returns true if pause is currently active (today is between starts_at and ends_at)
- `isFuture()` - Returns true if pause hasn't started yet (starts_at > now)

## Pause Lifecycle

### Creating a Pause

Use `PauseMembershipAction::create()`:

```php
use App\Actions\Membership\PauseMembershipAction;

$action = app(PauseMembershipAction::class);
$pause = $action->create($membership, [
    'starts_at' => '2025-11-01',
    'ends_at' => '2025-11-30',
    'reason' => 'Vacation',
    'extends_contract' => true,
]);
```

**What happens:**
1. Pause record is created
2. If `extends_contract` is true, the membership period end date is extended by the pause duration
3. Membership status is updated to `PAUSED` if pause is currently active
4. Activity log entry is created

### Editing a Pause

Use `PauseMembershipAction::edit()`:

```php
$action->edit($pause, [
    'ends_at' => '2025-12-15', // Changed from Nov 30 to Dec 15
    'extends_contract' => true,
]);
```

**What happens:**
1. Old contract extension is reverted
2. New contract extension is applied (if enabled)
3. Membership status is recalculated
4. Activity log entry is created

**Note:** You cannot edit `starts_at` for a pause that has already begun (`isFuture() === false`).

### Deleting a Pause

Use `PauseMembershipAction::remove()`:

```php
$action->remove($pause);
```

**What happens:**
1. Contract extension is reverted (if applicable)
2. Pause record is deleted
3. Membership status is recalculated
4. Activity log entry is created

## Contract Extension

When `extends_contract` is enabled, the pause duration is added to the membership's contract end date.

### Calculation

The pause duration is calculated as:
```php
$duration = $pause->starts_at->diffInDays($pause->ends_at) + 1;
```

**Important:** The `+ 1` is because both start and end dates are inclusive. A pause from Nov 1 to Nov 5 is 5 days (not 4).

### Example

**Original contract end:** January 31, 2026
**Pause:** November 1 to November 30 (30 days)
**New contract end:** March 2, 2026 (31 days + 30 days)

### Implementation

Contract extension modifies the latest `MembershipPeriod` record's `ends_at` date:

```php
$period = $membership->periods()->orderByDesc('ends_at')->first();
$period->ends_at = $period->ends_at->addDays($extensionDays);
$period->save();
```

If the membership has an `ends_at` (scheduled cancellation), that date is also extended.

## Billing Impact

### Charge Exclusion

When the billing system calculates pending charges, it filters out any billing dates that fall within a pause period. This happens in `Membership::pendingCharges()` (app/Models/Membership.php:334-344).

```php
$occurrences = $occurrences->filter(function (CarbonImmutable $occurrence): bool {
    foreach ($this->pauses as $pause) {
        if ($pause->starts_at->lte($occurrence) &&
            ($pause->ends_at === null || $pause->ends_at->gt($occurrence))) {
            return false; // Exclude occurrences within pause periods
        }
    }
    return true; // Occurrence is not paused
});
```

### Last Charged Date During Pauses

**Important:** The `last_charged_at` field is NOT updated while a membership is paused. This is intentional and correct behavior.

**Example Timeline:**
- August 15: Last charge created → `last_charged_at` = August 15
- August 15 - November 15: Member is paused (3 months)
- November 15: Billing resumes
- November 15: Next charge created → `last_charged_at` = November 15

During the pause (September 15, October 15), no charges are created and `last_charged_at` remains August 15.

**Why this matters:**
- The system uses `last_charged_at` + billing interval to calculate next charge
- Pauses are stored separately and filter out billing dates
- `last_charged_at` represents the actual last time the member was billed
- This is critical for the pause deletion issue (see Limitations below)

### Billing Resumes on Pause End Date

**Critical behavior:** Billing resumes **on** the pause end date, not the day after.

**Important:** The last day of the pause is the first day the membership will be charged again.

**Example:**
- Pause period: November 1 - November 15
- Billing date: 15th of each month
- **Last day of pause:** November 15
- **First charge after pause:** November 15 (same day!)
- **Result:** The member is charged on November 15

**Member Communication:**
When setting a pause end date, make sure members understand:
- "Your pause ends on November 15" means billing **resumes** on November 15
- They will be charged **on** November 15, not November 16
- November 15 is both the last day of pause AND the first billing day

**Why this design:**
- Prevents billing gaps or double-charges
- Clear boundary: pause days don't get billed, non-pause days do
- Simpler logic: end date is exclusive for pause, inclusive for billing

This is why the filter uses `$pause->ends_at->gt($occurrence)` (greater than) instead of `gte` (greater than or equal). The pause end date itself is not considered paused.

### Example Scenarios

#### Scenario 1: Pause Covers Billing Date
- Member pays on the 15th
- Pause: Nov 10 to Nov 20
- **Result:** November 15 charge is **skipped**

#### Scenario 2: Pause Ends on Billing Date
- Member pays on the 15th
- Pause: Nov 1 to Nov 15
- **Result:** November 15 charge is **included** (billing resumes)

#### Scenario 3: Multiple Pauses
- Member pays on the 15th
- Pause 1: Nov 5 to Nov 10
- Pause 2: Dec 1 to Dec 20
- **Result:** November 15 charge **included**, December 15 charge **skipped**

#### Scenario 4: Indefinite Pause
- Member pays on the 15th
- Pause: Nov 1 to null (no end date)
- **Result:** All future charges **skipped** until pause is ended

## Status Management

### Membership Status Field

The `membership.status` field reflects the current state:
- `ACTIVE` - Membership is active and billing normally
- `PAUSED` - Membership is currently paused
- Other statuses (CANCELLED, LEGACY, etc.) are unaffected by pauses

### Status Updates

Status is updated automatically in two ways:

1. **Immediately** when pause is created/edited/deleted (via `PauseMembershipAction`)
2. **Daily** at 02:24 (tenant timezone) via scheduled job `UpdateMembershipStatusJob`

The status logic in `Membership::calculateStatus()`:
```php
if ($this->activePause($date)) {
    return MembershipStatus::PAUSED;
}
// ... other status checks
```

### Active Pause Detection

`Membership::activePause(?CarbonInterface $date)` returns the pause that is active on a given date:

```php
return $this->pauses()
    ->where('starts_at', '<=', $date)
    ->where(function ($query) use ($date) {
        $query->whereNull('ends_at')->orWhere('ends_at', '>=', $date);
    })
    ->first();
```

**Note:** This uses `>=` (not `>`) because for status purposes, the membership is considered paused **through** the end date. A pause ending on Nov 15 means the member is paused for the entire day of Nov 15, but billing can still resume that day.

## UI Components

### Pause Modal

Located at `resources/views/livewire/app/modals/pause-membership.blade.php`

**Features:**
- Date selection from upcoming payment dates
- Reason text field
- Contract extension toggle with preview
- End date preview showing new contract end date
- Confirmation modal showing contract impact
- Delete functionality for existing pauses

### Preview Calculation

The modal shows a real-time preview of how the pause will affect the contract end date using `PauseMembershipAction::previewEndDate()`.

## Best Practices

### 1. Always Use Actions

Never manipulate pause records directly. Always use `PauseMembershipAction` methods to ensure:
- Contract dates are properly adjusted
- Membership status is updated
- Activity logs are created
- Database integrity is maintained

### 2. Validate Date Ranges

Before creating a pause, consider validating:
- Start date is not in the past (unless explicitly allowed)
- End date is after start date
- No overlapping pauses exist (see Limitations below)

### 3. Handle Edge Cases

Consider these scenarios:
- What happens if a pause extends beyond the membership end date?
- How are indefinite pauses handled in your business logic?
- Should there be a maximum pause duration?

### 4. Communicate with Members

When implementing pauses, ensure members understand:
- When billing will resume
- Whether their contract is extended
- How to end a pause early if needed

### 5. Never Delete Pauses - Edit Instead

**Critical:** If a pause needs to be corrected or ended early:

✅ **DO:** Edit the pause to change the end date
```php
$action->edit($pause, ['ends_at' => '2025-10-31']); // End early
```

❌ **DO NOT:** Delete the pause
```php
$action->remove($pause); // DANGER: May create retroactive invoices
```

**Why:** Deleting a pause causes the billing system to "forget" the pause ever existed. The system then tries to bill for all skipped periods, creating multiple invoices at once.

**If you must delete:** Only delete pauses that:
- Haven't started yet (`isFuture() === true`)
- Were created by mistake immediately after creation
- Never had any billing dates within their range

**UI Consideration:** The delete button in the pause modal should show a warning when the pause has already started or contains past billing dates.

## Limitations and Known Issues

### ⚠️ CRITICAL: Do Not Delete Pauses with Past Charges

**Current behavior:** When a membership is paused, `last_charged_at` is NOT updated during the pause period. If a pause is deleted after the fact, the system will see a very old `last_charged_at` and attempt to create all missed charges retroactively.

**Example of the Problem:**

```
Timeline:
Aug 15     Sep 15     Oct 15     Nov 15     Dec 1      Dec 15
   |          |          |          |          |          |
   ✓          X          X          ✓          |          ?
Charged   (paused)   (paused)   Charged    Delete    Next billing
                                            pause     date

✓ = Charge created
X = Charge skipped (paused)
```

**What happens:**
1. August 15: Member charged → `last_charged_at` = Aug 15
2. August 15 - November 15: Pause active (no charges for Sep 15, Oct 15)
3. November 15: Billing resumes → charge created → `last_charged_at` = Nov 15
4. December 1: **Admin deletes the pause**
5. December 15: System calculates pending charges
   - Reads `last_charged_at` = Nov 15 (correct)

**BUT if pause deleted BEFORE Nov 15 charge:**

1. August 15: Member charged → `last_charged_at` = Aug 15
2. August 15 - November 15: Pause active
3. **October 1: Admin deletes pause** (thinking they made a mistake)
4. October 15: System calculates pending charges
   - Reads `last_charged_at` = Aug 15 (2 months ago!)
   - Pause deleted, so filter doesn't skip Sep/Oct charges
   - **Creates 2 invoices immediately** (Sep 15 + Oct 15)
   - Error: `MembershipHasMultiplePendingChargesException`

**Impact:**
- Deleting a pause triggers creation of multiple retroactive invoices
- Members receive unexpected charges for paused periods
- Financial data becomes inconsistent
- Can trigger `MembershipHasMultiplePendingChargesException`

**Current Workaround:** **DO NOT DELETE PAUSES.** If a pause needs to be ended early:
1. Edit the pause to set a new `ends_at` date instead of deleting it
2. The pause record remains in history with accurate dates

**TODO:** Implement proper pause deletion handling:
- Option 1: Update `last_charged_at` to the pause end date when deleting
- Option 2: Skip retroactive charge creation when pause gap is detected
- Option 3: Add warning dialog in UI when deleting pauses with billing gaps
- Option 4: Prevent deletion of pauses that have already started

**Related Code:**
- `app/Actions/Membership/PauseMembershipAction.php:123-150` - Remove method
- `app/Actions/Recurrent/CreateMembershipTransactionsAction.php:63-70` - Multiple pending charges check
- `app/Models/Membership.php:312-358` - pendingCharges calculation

### No Overlap Validation

**Current behavior:** The system allows multiple overlapping pauses to exist simultaneously.

**Impact:**
- Unpredictable behavior when multiple pauses overlap
- Contract extensions may be calculated incorrectly
- Status may be ambiguous

**Recommendation:** Add validation to prevent overlapping pauses (see CLAUDE.md suggestions #1).

### Single Pause Assumption

**Current behavior:** `Membership::actualOrFuturePause()` returns only the first active or future pause.

**Impact:** If multiple future pauses exist, only one is returned.

**Recommendation:** Either enforce single active/future pause via validation, or rename method to `firstActualOrFuturePause()`.

### No Maximum Duration

**Current behavior:** Pauses can be any length, including indefinite (null end_at).

**Impact:**
- Members could pause indefinitely without canceling
- No business rules limiting pause abuse

**Recommendation:** Consider adding settings for:
- Maximum pause duration (e.g., 6 months)
- Whether indefinite pauses require approval
- Annual pause limits per member

### Historical Pauses

**Current behavior:** No restriction on creating pauses in the past.

**Impact:** Could be used to retroactively adjust billing history.

**Recommendation:** Add validation to prevent creating historical pauses unless explicitly allowed for data imports.

## Testing

Comprehensive test coverage exists for pause functionality:

### Unit Tests
- `tests/Feature/Models/MembershipPauseBillingTest.php` - Billing behavior
- `tests/Feature/Models/MembershipActualOrFuturePauseTest.php` - Query methods

### Integration Tests
- `tests/Feature/Actions/PauseMembershipActionTest.php` - Action behavior
- `tests/Feature/Actions/Recurrent/CreateMembershipTransactionsActionTest.php` - Transaction creation
- `tests/Feature/Livewire/PauseMembershipModalTest.php` - UI component

### Key Test Cases
- ✅ Billing resumes on pause end date
- ✅ Contract extension calculation
- ✅ Multiple pause operations
- ✅ Toggle contract extension on/off
- ✅ Indefinite pauses
- ✅ Active vs future pauses

## Related Documentation

- **MEMBERSHIPS.md** - General membership lifecycle and status management
- **TRANSACTIONS.md** - How pauses affect transaction creation
- **INVOICE_STATUSES.md** - Invoice generation with paused memberships

## API Reference

### PauseMembershipAction

```php
// Create a pause
create(Membership $membership, array $data): MembershipPause

// Edit an existing pause
edit(MembershipPause $pause, array $data): MembershipPause

// Remove a pause
remove(MembershipPause $pause): void

// Preview contract end date change
previewEndDate(
    Membership $membership,
    ?MembershipPause $pause,
    array $data,
    string $operation  // 'create', 'edit', or 'delete'
): CarbonImmutable

// Get current contract end date
contractEndDate(Membership $membership): CarbonImmutable
```

### Data Structure

```php
[
    'starts_at' => '2025-11-01',      // Required: YYYY-MM-DD format
    'ends_at' => '2025-11-30',        // Optional: null for indefinite
                                      // IMPORTANT: Member will be charged ON this date
    'reason' => 'Medical leave',      // Optional: free text
    'extends_contract' => true,       // Optional: defaults vary (see CLAUDE.md #3)
]
```

**Critical Note on `ends_at`:**
- The `ends_at` date is the **last day** of the pause
- Billing resumes **ON** the `ends_at` date (not the day after)
- If `ends_at` matches a billing date, the member **will be charged** that day
- Example: Pause ends Nov 15, billing is 15th of month → charged on Nov 15

## Changelog

### 2025-11-13
- Fixed billing logic to resume charges on pause end date (changed `gte` to `gt` in pendingCharges filter)
- Added comprehensive test coverage for pause end date billing scenarios
- Created PAUSES.md documentation
