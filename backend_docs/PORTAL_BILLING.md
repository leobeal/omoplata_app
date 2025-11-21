# Portal Billing

The billing page shows a member's latest transactions and saved payment methods.
Up to five transactions are loaded from the payer and displayed with their
description, formatted amount and transaction date (using the club's date
format). If an invoice exists a download link is shown next to the amount.

For wide screens the transactions appear in a table. On small devices the
same data is displayed in a card layout to avoid horizontal scrolling. The card
layout is hidden once the viewport reaches the `sm` breakpoint so the table is
shown on larger screens.

Payment methods are listed below the transactions and include the method name
and last four digits. Managing payment methods (adding or updating) is only
possible when `PortalMemberSettings` allows changes in payment methods.
