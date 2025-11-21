# Custom Alert Rules - User Guide

This guide explains how to create and manage your own custom alert rules without writing any code.

## What are Custom Alert Rules?

Custom alert rules allow you to monitor specific conditions in your system and automatically create alerts when those conditions are met. For example:

- Alert when a user hasn't logged in for 30 days
- Alert when a membership is expiring soon
- Alert when a member has no payment method
- Alert when a document request hasn't been fulfilled

## How to Create a Custom Rule

1. Navigate to **Settings > Alerts**
2. View existing custom alert rules
3. Custom rules can currently be created programmatically (visual builder coming soon)

### Creating Rules Programmatically

For now, custom rules must be created through code or database. Contact your developer to create rules. The visual rule builder is coming in a future update.

### Step 1: Basic Information (When Using Code)

- **Rule Name**: Give your rule a descriptive name (e.g., "Inactive Users Alert")
- **Description**: Optional explanation of what this rule checks
- **Model to Monitor**: Choose what type of record to check (User, Membership, etc.)
- **Check Frequency**: How often to run this check (in hours)
- **Default Assignee**: Optionally assign new alerts to a specific team member

### Step 2: Define Conditions

Conditions determine when alerts should be created. You can add multiple conditions - all must be met for an alert to be created.

#### Common Condition Examples

**Check if a date field is in the past:**
- Field: `created_at`
- Operator: `<=`
- Value: `30 days ago`
- Type: `date`

**Check if a date is in the future:**
- Field: `ends_at`
- Operator: `<=`
- Value: `7 days from now`
- Type: `date`

**Check if a user has memberships:**
- Relation: `memberships`
- Relation Type: `count`
- Operator: `>`
- Value: `0`

**Check if a user doesn't have payment methods:**
- Relation: `paymentMethods`
- Relation Type: `doesnt_exist`

### Step 3: Alert Template

Define what the alert will look like when created. You can use placeholders to insert values from the record.

**Placeholders:**
- Use `{field_name}` to insert any field value
- Example: `{first_name}`, `{last_name}`, `{id}`, `{email}`
- Nested fields: `{user.name}`, `{membership.plan.name}`

**Example Templates:**

Alert Title:
```
User {first_name} {last_name} inactive for 30 days
```

Alert Description:
```
User #{id} ({email}) hasn't logged in since {last_online_at}. Consider reaching out.
```

Action Needed:
```
Contact the user to check if they're still interested
```

## Example Rules

### 1. Inactive Members Alert

**What it does:** Alerts when members haven't attended a class in 14 days

- **Model**: User
- **Conditions:**
  - Field: `last_attendance_at` <= `14 days ago` (Date)
  - Relation: `memberships` count > 0
- **Alert Title:** `Member {first_name} {last_name} hasn't attended in 14 days`
- **Action:** `Follow up to check if everything is okay`

### 2. Expiring Memberships

**What it does:** Alerts 7 days before a membership expires

- **Model**: Membership
- **Conditions:**
  - Field: `ends_at` <= `7 days from now` (Date)
  - Field: `ends_at` >= `now` (Date)
- **Alert Title:** `Membership expiring soon`
- **Action:** `Contact member about renewal`

### 3. Users Without Email Verification

**What it does:** Alerts when users haven't verified their email after 3 days

- **Model**: User
- **Conditions:**
  - Field: `email_verified_at` = `null` (Null)
  - Field: `created_at` <= `3 days ago` (Date)
- **Alert Title:** `User {first_name} hasn't verified email`
- **Action:** `Resend verification email`

## Managing Rules

### Activate/Deactivate

Click the status badge to toggle a rule on or off. Inactive rules won't create new alerts but existing alerts remain.

### Edit a Rule

Click **"Edit"** to modify conditions or templates. Changes apply to new alerts only.

### Delete a Rule

Click **"Delete"** to remove a rule. All alerts created by this rule will also be removed.

## How It Works

1. **Automatic Checking**: The system checks your active rules every hour (or based on the frequency you set)
2. **Alert Creation**: When conditions are met, an alert is automatically created
3. **Auto-Resolution**: When conditions are no longer met, alerts are automatically resolved
4. **No Duplicates**: The system won't create duplicate alerts for the same record

## Tips for Writing Good Rules

✅ **Be Specific**: Use clear, descriptive names and titles
✅ **Add Context**: Include helpful information in the description
✅ **Use Placeholders**: Make alerts personalized with actual data
✅ **Test Carefully**: Start with a high frequency (every hour) to test, then adjust
✅ **Don't Over-Alert**: Too many alerts can be overwhelming

❌ **Avoid**: Creating rules that will generate hundreds of alerts
❌ **Avoid**: Using vague titles like "Alert" or "Check this"
❌ **Avoid**: Setting very low frequencies (every hour) for non-urgent checks

## Supported Date Formats

When using date conditions, you can use these formats:

- `X days ago` (e.g., "7 days ago", "30 days ago")
- `X weeks ago` (e.g., "2 weeks ago")
- `X months ago` (e.g., "1 month ago")
- `X years ago` (e.g., "1 year ago")
- `X days from now` (e.g., "7 days from now")
- `X weeks from now`
- `X months from now`
- `now` (current date/time)
- Specific dates (e.g., "2025-12-31")

## Permissions

Access to custom alert rules in settings requires the `see settings alerts` permission. This follows the standard settings permissions pattern in Omoplata.

## Need Help?

If you're having trouble creating a rule or need to monitor something specific, contact your system administrator or refer to the technical documentation at `docs/ALERTS_SYSTEM.md`.
