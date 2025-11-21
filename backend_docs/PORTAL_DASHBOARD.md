# Portal Dashboard

The portal dashboard gives members a quick overview of their activity.

- **Next Classes:** shows up to three upcoming classes the member can attend.
- **Membership:** displays the active membership details.
- **Dependents:** parents see upcoming classes for each child.
- **Check-in Code:** shows the six-digit code each member uses on the tablet.
- **Attendance Chart:** a line chart built with Chart.js that visualizes attendance for the last six weeks (grouped by week). When a member has dependents, the chart also includes a line for each child so families can track attendance at a glance.

Dashboard data is assembled through small, focused actions under `App\Actions\Portal\Dashboard` and orchestrated by `GetDashboardDataAction`.
