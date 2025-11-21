# Transaction statuses

Transactions in Omoplata can move through several statuses. The table below outlines the default transitions. These rules can be adjusted in the `allowedTransitions` method of the `Transaction` model.

- **pending** – newly created transactions awaiting processing. Can transition to **processing** or **canceled**.
- **processing** – being prepared for invoicing. Can move to **pending**, **invoiced**, or **canceled**.
- **invoiced** – included on an invoice. Can change to **processing**, **completed**, **failed**, or **canceled**.
- **completed** – successfully settled. Can be moved to **refunded**.
- **failed** – payment failed. Can return to **pending** or be **canceled**.
- **canceled** – will not be collected. Final state.
- **refunded** – previously completed but later refunded. Final state.
- **overdue** – payment is overdue. Can transition to **pending**, **uncollectible**, or **canceled**.
- **uncollectible** – deemed uncollectible. Can revert to **pending** or be **canceled**.

Whenever a transaction status changes, an `transaction_status_updated` entry is written to the activity log.
