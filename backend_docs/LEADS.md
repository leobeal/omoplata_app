## Leads

### Statistics
The leads index page shows quick statistics above the table:

- **Number of Leads** – total amount of leads stored. The subtext indicates how many new leads were created this month.
- **Converted Leads** – count of leads with status `converted`. The subtext displays conversions that happened this month.

When converting a lead to a member you can review the personal information and select a different user demographic if needed. This ensures the correct plans are available during the conversion.

The same conversion modal can also be opened without a lead. In that case the fields for name and email—including guardian details—are optional so the member can fill them out later during onboarding.

The quick view panel shows a link to download the contract PDF when a lead has accepted the trial terms. The file path is stored in the `meta->contract_path` field and is served through `DownloadLeadContractController`, which checks the `manage leads` permission.

From the quick view you can also create a member. The **Create Member** button opens the same conversion modal used on stations and pre-fills the form with the lead's information.
Once the member is created an onboarding link is generated via `SendMemberInvitedNotificationAction`. The link is shown to the admin and can also be emailed to the responsible if present or directly to the member.
The conversion modal now includes an optional checkbox—visible only when converting from the app—to control whether this invitation email is sent. The checkbox is unchecked by default.

### Statuses
Leads progress through several statuses such as `new`, `contacted` or `scheduled` until they are either `converted` or marked as `lost`. The quick view now displays the current status and lists possible transitions. Changing the status triggers an activity log entry and refreshes the panel.

### Editing
Leads can be updated without leaving the index page. Selecting a row opens the existing quick view drawer where an **Edit** button toggles an inline form. Core details—name, contact info and demographic—become editable. Age group radios match the trial sign‑up flow, and guardian fields appear only when the chosen demographic requires a payer.

Changes are validated as they are entered and saved with a single **Save** action that shows a success toast. A **Cancel** action discards modifications and returns to the read‑only view. This approach keeps context, avoids page reloads and provides a smooth Livewire experience for managing lead information.
