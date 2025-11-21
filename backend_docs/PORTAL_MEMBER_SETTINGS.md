# Portal Member Settings

The `PortalMemberSettings` class controls which profile sections members can update themselves.
It defines three boolean options managed through the `portal_member` settings group:

- `allow_changes_in_personal_info` – allow editing personal information. Defaults to `false`.
- `allow_changes_in_sports` – allow members to manage their training schedule (sports, classes or time slots depending on the club setting). Defaults to `true`.
- `allow_changes_in_payment_methods` – allow adding or updating payment methods. Defaults to `false`.
- `allow_membership_cancellation` – allow members to schedule the cancellation of their membership. Defaults to `false`.

When a section is disabled the corresponding form is shown in read-only mode and any save action is ignored.
