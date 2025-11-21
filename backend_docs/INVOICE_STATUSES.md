# Invoice statuses

Invoices in Omoplata go through several status transitions. Changing the status triggers side effects on related transactions and payments.

## Status Definitions

- **pending** – newly created invoices. Setting an invoice back to pending resets `paid_at` and marks related transactions as `invoiced`.
- **processing** – invoices that are being charged (legacy status, kept for backward compatibility). Related transactions are marked as `invoiced`.
- **waiting_to_send** – invoices included in a SEPA file that hasn't been uploaded to the bank yet. Related transactions are marked as `waiting_to_send`. This status is set when a SEPA XML file is generated.
- **sent_to_bank** – invoices included in a SEPA file that has been uploaded to the bank. Related transactions are marked as `sent_to_bank`. This status is set when the SEPA XML file status changes to `uploaded`.
- **pending_retry** – an earlier collection attempt failed. Transactions are marked as `failed` so the retry logic can pick them up again.
- **on_hold** – temporarily pause the invoice while keeping the transactions marked as `invoiced`.
- **overdue** – the due date has passed without receiving a payment. Related transactions are marked as `overdue`.
- **paid** – the invoice has been settled. Transactions become `completed`, a payment record is created if none exists and the `paid_at` timestamp is stored. An invoice can be set back to **pending**, which clears `paid_at` again.
- **canceled** – the invoice will not be charged. Transactions are marked as `canceled`. Can be reverted to **pending** (to reactivate) or changed to **void**.
- **refunded** – the invoice was paid and later refunded. Transactions are marked as `refunded`. Can be reverted to **paid** (if refund was reversed) or to **pending**.

## SEPA Payment Workflow

When using SEPA direct debit, invoices follow this workflow:

1. **pending** → **waiting_to_send** – When a SEPA XML file is generated via `GenerateSepaXmlAction`
2. **waiting_to_send** → **sent_to_bank** – When the SEPA file is uploaded to the bank (status changes to `uploaded`)
3. **sent_to_bank** → **paid** – When the SEPA file is marked as `processed` by the bank, or automatically after a configured number of days (fallback mechanism via `MarkProcessingInvoicesAsPaidJob`)

If a SEPA file is deleted before being uploaded, invoices revert from **waiting_to_send** back to **pending**.

## Side Effects

Whenever the status is successfully changed an entry is written to the activity log using the `invoice_status_updated` event.

The `Invoice::updateStatus()` method automatically updates the status of all related transactions to match the invoice status:
- **waiting_to_send** → transactions: `waiting_to_send`
- **sent_to_bank** → transactions: `sent_to_bank`
- **paid** → transactions: `completed` + creates payment record

> **Important:** Always change invoice statuses using `Invoice::updateStatus()`. Never update the `status` column directly in the database so all side effects and activity log entries are performed consistently.
