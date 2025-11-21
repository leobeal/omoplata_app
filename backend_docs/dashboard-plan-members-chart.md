# Plan Members Chart

A Livewire component displays a line chart on the admin dashboard showing the number of active plan members grouped by user demographic. The component uses Chart.js through a CDN and supports changing the time period.

## Usage

Include the component on any dashboard page:

```blade
<livewire:app.dashboard.plan-members-chart />
```

The period selector allows switching between the last month, quarter or year. The chart updates automatically when the period changes.
