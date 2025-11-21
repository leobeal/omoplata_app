## Users and memberships
### Importing existing members
Existing club members can be imported via an artisan command executed by `ImportUsersAction`.
Imported users are treated as already active members, that means we won't create any transaction.
Their memberships start in the **active** status. If a cancellation date is provided and is today or in the past, the status is set to **cancelled**.

### Creating new members
When creating a member through the UI we assume it is a brand‑new member and handle sign‑up logic accordingly.


### Memberships
```
$user->memberships is a collection of memberships that the user is a member of. Ir uses a BelongsToMany on the membership_user.
$user->payingMemberships is a collection of memberships that the user is paying for. Uses a has many, since the membership table has a payer_id field.
payingMemberships is used when doing any financial operations.
```

### Fees and Sign‑Up Charges

Plans may include additional fees. If a fee has **no** recurring rule (`rrule` is `null`), it is considered a sign‑up fee and is charged immediately when the membership is created. The `CreateMembershipAction` will create a pending transaction for every sign‑up fee attached to the plan.

If the membership starts before regular charges begin (`starts_at` is earlier than `charge_starts_at`), the action also creates a prorated transaction covering that initial period.

Recurring fees (those with an `rrule`) are scheduled automatically by the jobs that generate membership transactions.

When creating a member through the wizard, if the chosen plan has sign‑up fees their names and prices are listed. A checkbox allows skipping those charges. When unchecked no sign‑up fee transactions will be created.


### Start date logic

`CreateFullMemberAction` determines which transactions to create based on the
membership `starts_at` and `charge_starts_at` dates:

- **Start several billing periods ago** – if more than one charge would already
  be due at sign‑up, all those historical charges are generated immediately via
  `CreateOldMembershipTransactionsAction`. The regular charge start is in the
  past so no prorated amount is calculated.

- **Start within the current billing period** – when the start date is in the
  past but less than one full interval old, the action creates a prorated charge
  covering the days until `charge_starts_at`. `last_charged_at` is set one
  period before the first upcoming charge so automated billing continues on the
  expected date.

- **Future start date** – a membership beginning in the future also receives a
  prorated charge for the initial partial period (unless `createProratedFees` is
  explicitly disabled). The `last_charged_at` value is set one interval before
  `charge_starts_at` to ensure the first automatic charge runs on schedule.

Example: today is `26.06`, a new membership starts on `03.06` and the first
regular charge is on `01.07`. A prorated transaction for `03.06 - 30.06` is
created and `last_charged_at` becomes `01.06`. The next scheduled charge will be
on `01.07` as expected.

### Membership status

Memberships have a `status` field used to quickly show whether a member is
currently active or paused. The value is updated automatically by a daily job
running at `02:24` in each tenant's timezone. The job examines active pauses and
the cancellation date (`ends_at`):

- **Paused** – when a pause record spans the current day.
- **Active** – when there is no active pause and the membership has not
  ended. Memberships may be paused even before they start.

If a cancellation date is set in the future the status is still updated until
that day. Ended memberships keep their last status value but the job no longer
touches them once the end date is past.

To trigger the status update manually run:

```bash
php artisan membership:update-status --tenant=<id>
```

### Cancellation date

The `ends_at` column is only filled when a membership has been scheduled for
termination. Active contracts that continue indefinitely keep this field
`null`, so it must not be used as the "last day" of the contract. The current
contract end date is tracked through the latest `membership_period`. When a
pause extends the contract, the ending date of that last period is shifted
forward accordingly.

### Membership Periods

Omoplata keeps track of the contract cycles of a membership through the
`membership_periods` table. `CreateMembershipPeriodAction` is responsible for
creating those periods. When a membership starts in the past, the action now
creates all missing periods up to the current one automatically. For example, if
today is `15.08` and a membership with a six‑month contract duration started on
`01.01`, two periods are created: `01.01 - 01.07` and `01.07 - 01.01` of the next
year. This ensures a period always spans the present time.
