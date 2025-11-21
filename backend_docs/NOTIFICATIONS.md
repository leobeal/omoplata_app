# Notifications

Notification templates allow clubs to customise messages sent via email, SMS or even letter. Templates are stored in the `notification_templates` table and can be edited from **Settings → Notifications**.

## Data model

Each template has:

- `key` – unique identifier (e.g. `direct_debit_charge_failed`).
- `channel` – delivery channel (`email`, `sms`, `letter`).
- `notification` – fully qualified notification class used to send it.
- `subject` – optional subject line for emails.
- `body` – Markdown content that can contain CTA placeholders.

Users may edit existing templates but cannot create new ones. The settings section lists all available templates; selecting one opens an **Editor** with a live **Preview** rendered via Laravel's Markdown engine so the final message can be reviewed before saving.

## CTA placeholders

Templates may include call‑to‑action placeholders in the form:

```
[cta type='confirm']
```

When rendering the notification, these placeholders are replaced with links provided by the notification. For example:

```php
$template->render([
    'confirm' => ['text' => 'Confirm', 'url' => 'https://example.com']
]);
```

## Example

Notification classes are responsible for supplying CTA data when rendering templates and may provide sample data via a `previewCtas()` method for the editor preview.
