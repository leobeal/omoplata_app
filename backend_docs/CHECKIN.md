# Check-in Settings

Members can check in to upcoming classes through the portal. The behaviour of this feature can be configured via **CheckInSettings** (settings group `checkin`).

- `attendance_intention_enabled` – When enabled (default), members are asked whether they intend to attend upcoming classes on the dashboard. Disabling it hides the question and only lists upcoming classes.
- `requires_intention` &ndash; When enabled, a member may only check in if they previously created an attendance intention with status "yes". Attempts without a matching intention are rejected and logged. Defaults to `false`.
- `minutes_before_start` & `minutes_after_start` &ndash; Define the time window around the class start that counts for check in. Defaults are 30 minutes before and 10 minutes after the scheduled start.

Times are evaluated and stored in the club's timezone set via
`GeneralSettings`. Occurrence timestamps are saved using this timezone without
conversion, and the check-in window is calculated directly against these local
times.
