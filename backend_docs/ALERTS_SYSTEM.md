# Alerts & Tasks System

The Alerts & Tasks system is a comprehensive monitoring and notification system that automatically detects issues and creates actionable alerts for administrators.

## Overview

The system automatically checks for various conditions that require attention and creates alerts that can be:
- **Marked as Done** - When the issue has been resolved
- **Ignored** - When the alert is not relevant or requires no action
- **Auto-Resolved** - When the system detects the condition no longer exists
- **Reopened** - When a resolved alert needs attention again
- **Reassigned** - When a different team member should handle the alert

## Architecture

### Models

**Alert** (`app/Models/Alert.php`)
- Stores alert information
- Polymorphic relationship to any alertable model
- Tracks status, assignee, and resolution

### Enums

**AlertType** (`app/Enums/AlertType.php`)
- `SEPA_FILE_NOT_SENT` - SEPA file created but not sent after 12 hours
- `BANK_TRANSACTIONS_NOT_FETCHED` - Bank transactions not fetched 5 days after SEPA file sent
- `MEMBER_STUCK_ON_ONBOARDING` - Member hasn't completed onboarding after 2 days
- `MEMBER_WITHOUT_PAYMENT_METHOD` - Active member has no payment method
- `MEMBERSHIP_PAUSE_ENDING` - Membership pause ending within 7 days

**AlertStatus** (`app/Enums/AlertStatus.php`)
- `OPEN` - Active alert requiring attention
- `IGNORED` - Alert was dismissed
- `DONE` - Alert was resolved by user action
- `AUTO_RESOLVED` - Alert was automatically resolved by system

### Alert Checkers

All checkers implement `AlertChecker` interface and extend `BaseAlertChecker`:

**SepaFileNotSentChecker** (`app/Services/Alerts/SepaFileNotSentChecker.php`)
- Checks for SEPA files in PENDING status for more than 12 hours
- Auto-resolves when file is UPLOADED or PROCESSED

**BankTransactionsNotFetchedChecker** (`app/Services/Alerts/BankTransactionsNotFetchedChecker.php`)
- Checks for SEPA files UPLOADED for more than 5 days without being PROCESSED
- Auto-resolves when file is PROCESSED

**MemberStuckOnOnboardingChecker** (`app/Services/Alerts/MemberStuckOnOnboardingChecker.php`)
- Checks for UserOnboarding records without terms_accepted_at after 2 days
- Auto-resolves when terms are accepted

**MemberWithoutPaymentMethodChecker** (`app/Services/Alerts/MemberWithoutPaymentMethodChecker.php`)
- Checks for users with active memberships but no payment methods
- Auto-resolves when payment method is added

**MembershipPauseEndingChecker** (`app/Services/Alerts/MembershipPauseEndingChecker.php`)
- Checks for membership pauses ending within 7 days
- Auto-resolves when pause has ended

### Jobs

**CheckAlertsJob** (`app/Jobs/Recurrent/CheckAlertsJob.php`)
- Runs hourly for each tenant
- Executes all alert checkers
- Both creates new alerts and auto-resolves existing ones

Scheduled in `routes/console.php`:
```php
Schedule::job(new CheckAlertsJob($tenant))
    ->timezone($tenant->timezone)
    ->hourly();
```

## UI Components

**Dashboard Widget** (`resources/views/livewire/app/dashboard/alerts.blade.php`)
- Displays open alerts on the dashboard
- Allows filtering by status
- Quick actions: Mark Done, Ignore, Reopen
- Shows alert type, creation time, assignee, and action needed

## Usage

### Creating a New Alert Checker

1. Create a new class extending `BaseAlertChecker`:

```php
use App\Services\Alerts\BaseAlertChecker;
use App\Enums\AlertType;

class MyCustomChecker extends BaseAlertChecker
{
    public function getAlertType(): AlertType
    {
        return AlertType::MY_CUSTOM_TYPE;
    }

    public function check(): void
    {
        // Logic to find issues
        $this->createOrUpdateAlert(
            type: $this->getAlertType(),
            title: 'Issue Title',
            description: 'Detailed description',
            alertable: $model, // Related model
            metadata: ['key' => 'value'],
            actionNeeded: 'Action to take'
        );
    }

    public function autoResolve(): void
    {
        // Logic to auto-resolve alerts
        $this->autoResolveForAlertable($this->getAlertType(), $model);
    }
}
```

2. Add the new alert type to `AlertType` enum
3. Register the checker in `CheckAlertsJob::CHECKERS` array
4. Add translation keys to `lang/*/alerts.php`

### Working with Alerts Programmatically

```php
use App\Models\Alert;
use App\Enums\AlertStatus;

// Find open alerts
$openAlerts = Alert::open()->get();

// Mark alert as done
$alert->markAsDone($user);

// Ignore alert
$alert->markAsIgnored($user);

// Reopen alert
$alert->reopen($user);

// Reassign alert
$alert->reassignTo($newUser, $currentUser);

// Auto-resolve alert
$alert->autoResolve();
```

### Alert Lifecycle and Smart Status Management

The alert system intelligently manages alert statuses based on previous administrative actions:

#### IGNORED Alerts - Permanent Dismissal
When an alert is marked as **IGNORED**, the system will **not** recreate the same alert for the same alertable entity, even if the condition still exists. This respects the administrator's explicit decision to dismiss the alert.

**Example:**
1. System creates alert: "SEPA file #123 not sent after 12 hours"
2. Admin ignores the alert (status = IGNORED)
3. System runs checks again - **no new alert is created** for SEPA file #123
4. The ignored alert remains in the database for audit purposes

To create a new alert for the same issue:
- Either **delete** the ignored alert
- Or **reopen** the ignored alert to change its status back to OPEN

#### DONE/AUTO_RESOLVED Alerts - Smart Reopening
When an alert is marked as **DONE** or **AUTO_RESOLVED**, the system will **reopen** the alert (set status back to OPEN) if the same condition is detected again. This ensures issues that recur are brought back to attention.

**Example:**
1. System creates alert: "SEPA file #123 not sent after 12 hours"
2. Admin marks as done (status = DONE)
3. File remains pending (condition still true)
4. System runs checks again - **alert is reopened** (status = OPEN)
5. Alert history shows it was previously resolved and reopened

This behavior ensures that:
- **Ignored alerts** stay dismissed (respects explicit admin decision)
- **Resolved alerts** that recur are brought back to attention (catches recurring issues)
- **Alert fatigue** is minimized by not creating duplicate alerts
- **Full audit trail** is maintained for all status changes

## Database Schema

```sql
CREATE TABLE alerts (
    id BIGINT UNSIGNED PRIMARY KEY,
    type VARCHAR(255),
    status VARCHAR(255) DEFAULT 'open',
    title VARCHAR(255),
    description TEXT,
    action_needed VARCHAR(255),
    assignee_id BIGINT UNSIGNED NULL,
    alertable_type VARCHAR(255) NULL,
    alertable_id BIGINT UNSIGNED NULL,
    metadata JSON NULL,
    resolved_at TIMESTAMP NULL,
    resolved_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    INDEX(status, type),
    INDEX(assignee_id, status),
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);
```

## Testing

Comprehensive tests in `tests/Feature/AlertSystemTest.php`:
- Tests for each alert checker
- Tests for alert lifecycle (create, resolve, reopen, reassign)
- Tests for CheckAlertsJob integration

Run tests:
```bash
php artisan test --filter AlertSystemTest
```

## Translation Keys

Translation files in `lang/{locale}/alerts.php`:
- `alerts.title` - Widget title
- `alerts.status.*` - Status labels
- `alerts.types.*` - Alert type labels
- `alerts.actions.*` - Action button labels
- `alerts.empty.*` - Empty state messages

## Activity Logging

All alert actions are logged via Spatie ActivityLog:
- Alert creation
- Status changes
- Reassignments
- Resolution

## Custom Alert Rules

Users can create their own alert rules through the UI without writing code. This allows for flexible monitoring of any model in the system.

### Features

- **Visual Rule Builder** - Define conditions through a user-friendly interface
- **Template System** - Use placeholders like `{field_name}` in alert titles and descriptions
- **Flexible Conditions** - Support for date, number, string, and relationship-based conditions
- **Auto-Resolution** - Custom rules automatically resolve alerts when conditions are no longer met
- **Frequency Control** - Set how often each rule should run (in hours)
- **Assignment** - Assign alerts to specific users by default

### Creating Custom Rules

Navigate to **Settings > Alerts** to manage custom rules. Rules can be created programmatically (visual builder coming soon). Define:

1. **Basic Information**
   - Rule name and description
   - Model to monitor (User, Membership, etc.)
   - Check frequency
   - Default assignee

2. **Conditions**
   - Field-based conditions (e.g., `created_at <= 7 days ago`)
   - Relationship conditions (e.g., has memberships, doesn't have payment methods)
   - Multiple conditions (all must be met)

3. **Alert Template**
   - Title with placeholders: `User {first_name} {last_name} needs attention`
   - Description and action needed

### Condition Types

**Date Conditions:**
```json
{
  "field": "created_at",
  "operator": "<=",
  "value": "7 days ago",
  "type": "date"
}
```

Supports: "X days/weeks/months/years ago" and "X days/weeks/months/years from now"

**Relationship Conditions:**
```json
{
  "relation": "memberships",
  "relation_type": "count",
  "operator": ">",
  "value": 0
}
```

Relation types:
- `exists` - Record has related items matching sub-conditions
- `doesnt_exist` - Record doesn't have related items
- `count` - Number of related items matches condition

**String/Number Conditions:**
```json
{
  "field": "email",
  "operator": "like",
  "value": "%@example.com",
  "type": "string"
}
```

### Example Custom Rules

**Inactive Users:**
```json
{
  "name": "Users inactive for 30 days",
  "model_type": "App\\Models\\User",
  "conditions": [
    {
      "field": "last_online_at",
      "operator": "<=",
      "value": "30 days ago",
      "type": "date"
    }
  ],
  "alert_title": "User {first_name} {last_name} inactive",
  "alert_description": "User hasn't logged in for 30 days"
}
```

**Memberships Expiring Soon:**
```json
{
  "name": "Memberships expiring in 7 days",
  "model_type": "App\\Models\\Membership",
  "conditions": [
    {
      "field": "ends_at",
      "operator": "<=",
      "value": "7 days from now",
      "type": "date"
    },
    {
      "field": "ends_at",
      "operator": ">=",
      "value": "now",
      "type": "date"
    }
  ],
  "alert_title": "Membership expiring soon"
}
```

### Technical Implementation

**CustomAlertRule Model** (`app/Models/CustomAlertRule.php`)
- Stores rule configuration
- Template rendering with `{placeholder}` syntax
- Frequency management

**CustomAlertChecker** (`app/Services/Alerts/CustomAlertChecker.php`)
- Dynamically builds queries based on conditions
- Parses relative dates
- Handles relationships
- Creates/updates alerts with custom type `custom_rule_{id}`
- Auto-resolves when conditions no longer met

**Integration**
- Runs in `CheckAlertsJob` alongside built-in checkers
- Respects `check_frequency_hours` setting
- Only runs active rules

### Managing Custom Rules

Access: **Settings > Alerts** (requires `see settings alerts` permission)

- **Activate/Deactivate** - Toggle rules on/off without deleting
- **Edit** - Modify conditions and templates (coming soon)
- **Delete** - Remove rule and all associated alerts
- **View History** - See when rules were last checked

### Testing

Comprehensive tests in `tests/Feature/CustomAlertRulesTest.php`:
- Date condition parsing
- Relationship conditions
- Template rendering
- Auto-resolution
- Frequency control

## Future Enhancements

Potential improvements:
- Email/Slack notifications for critical alerts
- Alert priority levels (low, medium, high, critical)
- Alert escalation after certain time periods
- Bulk actions on alerts
- Alert analytics and reporting
- Advanced rule builder with OR conditions
- Rule testing/preview before activation
