# Payments

Omoplata supports manual SEPA files as well as Stripe managed SEPA collections. In both cases invoices are created when a transaction is generated.

When an invoice is created, its title is built from the titles of all included transactions joined with a `+` sign. The resulting string is truncated to 140 characters since SEPA remittance information cannot exceed this length.

## Payment schedule settings

Two settings control the available payment days for memberships:

- `payment.payment_weekly_options` – list of allowed ISO week days (1 = Monday).
- `payment.payment_monthly_options` – list of allowed days of the month.

A club might only allow payments on **Monday** and **Friday**, or on the **1st** and **15th** of each month. These values can be changed from the database or via a settings UI in the future.

When a membership is created through the wizard the user selects a plan and then picks one of these options based on the plan’s charge interval. The actual `charge_starts_at` date is calculated automatically as the first occurrence of the chosen day after `starts_at`.

If `starts_at` lies in the past, Omoplata uses `CreateOldMembershipTransactionsAction` to
generate transactions for all missed occurrences up to the day before the member is created.
This prevents multiple charges from being generated on the first billing run.

## Invoice due dates

Sometimes the membership charge date should not be the actual deadline for
payment. The setting `payment.invoice_grace_period_days` defines how many days
after the charge date members have to settle an invoice. The calculated due date
is always at least one day in the future to provide a reasonable payment
window.

Zero amount invoices are automatically marked as paid and their transactions are completed.

Whenever an existing invoice is updated (for example after a failed debit)
its `prefixed_id` is suffixed with `-1`, `-2` and so on to indicate the number
of payment attempts. The suffix is incremented each time the invoice changes.

If a SEPA transaction is returned unpaid the member is charged an additional fee.
The amount is configured via the `payment.failed_transaction_fee` setting.

### CAMT return files

Uploaded CAMT files are stored in the `camt_files` table. Each record keeps the
original file name, the storage path, the message ID and who uploaded it. The
message ID originates from the `GrpHdr/MsgId` field of the CAMT file and is
unique. Tracking this information allows Omoplata to know exactly which bank
return files have been processed.

## Updating manual SEPA payment methods

Manual SEPA bank details can be updated from the quick view dialog. When a payer changes their IBAN or account holder a new payment method is created and all existing ones are marked as inactive. Existing memberships using the old method are automatically updated to the new one.

User payment methods have a `deactivated_at` timestamp. Only methods without this value are considered active by default.

When fetching payment methods for user always use active().

Each SEPA mandate stores the signature date as `mandate_date`. When creating or updating manual SEPA details a new mandate is issued using the current date. The BIC is optional because the OpenIBAN lookup service might fail. Missing BICs are handled asynchronously.

### SEPA sequence types

When Omoplata generates a SEPA XML file it checks if a mandate has been used before. The very first debit uses the `FRST` sequence type. All following debits for the same mandate switch to `RCUR`.

