# Invoice statistics

The invoices page displays a small summary widget showing the totals for the current month.
The values are calculated by `InvoiceStatisticsAction` and cached until the end of the day.
The Livewire Volt component `app.finance.invoices-stats` renders the figures.

It shows:
- the total amount of all invoices due this month
- the amount that has been paid
- the outstanding amount
- the number of invoices
