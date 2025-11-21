# Dashboard Schedule

The dashboard shows upcoming classes in a weekly view. The Livewire component `app.dashboard.schedule` loads occurrences for the selected week and allows navigation using previous/next buttons.

Each day highlights when sessions exist and clicking a day lists all occurrences. For every occurrence the widget shows the time span, how many spots are filled and the first avatars of members planning to attend.

The component relies on `AttendanceIntention` and `Attendance` records to determine participants.
Clicking the avatar group opens a modal that shows the occurrence details, lists checked-in members and attendance intentions, and reveals add or remove buttons when hovering over each member.
