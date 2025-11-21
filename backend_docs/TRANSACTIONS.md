
Scheduler
we loop through tenants and run daily at 3:33 on their timezone the ProcessMembershipTransactionsJob passing the tenantId.
ProcessMembershipTransactionsJob will fetch all users that have memberships and are the payer.
It will dispatch the ProcessMembershipJob job for each user.
ProcessMembershipJob will call CreateMembershipTransactionsAction
Another scheduled task runs at 2:24 in each tenant's timezone. It updates membership
statuses based on active pauses and skips only memberships that have already ended.
If a cancellation date is set in the future the status continues to update until that
day. This keeps the status flag in sync with pauses and cancellations, even before a
membership officially starts.

CreateMembershipTransactionsAction will:
fetch the memberships with pending charges. By default we look ahead a number of days defined in `payment.days_before_due_date` (0 by default). This uses the membership RRULE to get occurrences between the last charge and `today + days_before_due_date`.

If the user has no payment method, it will log and error, save in issues.

it will start a transaction
- loop though the memberships of the user;
- check if a membership has multiple charges pending and throw an exception - unexpected state that requires us checking.
- get price information fromm the plan
- loop though the pending charges 


Invoices


The due date of an invoice is calculated from the charge date plus the
`payment.invoice_grace_period_days` setting. This ensures members get a few extra
days to pay their invoice. If this value results in a date less than one day
ahead of today, Omoplata automatically sets the due date to `today + 1` day.



----

thoughts:

the job that will create transactions from the memberships will run every day.
so the transactions will be created based on the plan. if weekly, it will create a transaction every week.... obvious
now, the question is: when should we create the invoice?
Seems obvious that we should create the invoice when the transaction is created.
Imagine having weekly and monthly memberships... The invoices will be created in different intervals.
The SEPA file, though, will be probably created weekly In the smallest interval.



