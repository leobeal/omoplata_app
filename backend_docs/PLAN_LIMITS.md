# Plan Limits

Membership plans can restrict how members use the club. Typical examples are:

- limiting the number of training sessions per week;
- restricting how many sports a single membership can join;
- limiting the number of weekly **time slots** that can be selected; and
- allowing only a single class each week.

## Data Model

Limits are stored in the `plan_limits` table. A record specifies:

- `plan_id` – the plan the limit belongs to;
- `type` – the kind of limit, e.g. `sports`, `attendance` or `time_slots`;
- `value` – the maximum amount allowed; and
- `period` – optional period such as `week` or `month` (used for attendance based limits).

The `PlanLimit` model exposes this information and is related to `Plan` via `Plan::limits()`.
These limits are copied to the `membership_limits` table whenever a membership is created.

## Enforcing Limits

When a membership is created, the limits defined on its plan are copied to `membership_limits`. Each `MembershipLimit` mirrors the plan limit at the time of sign‑up.

The `PlanLimitService` contains helpers to validate limits.
- `checkSportsLimit()` verifies if a given number of sports is within a limit object.
- `checkTimeSlotsLimit()` verifies if a number of weekly time slots is allowed.
- `checkAttendanceLimit()` checks weekly or monthly attendance by looking up existing `Attendance` records and any `AttendanceIntention` with status `yes`. This prevents members from reserving more classes than allowed.
- `checkSportsLimitForMembership()`, `checkTimeSlotsLimitForMembership()` and `checkAttendanceLimitForMembership()` automatically resolve the appropriate `MembershipLimit` and apply the same logic.

### Example

Suppose a plan allows **two classes per week**. Create a limit record:

```php
PlanLimit::create([
    'plan_id' => $plan->id,
    'type' => 'attendance',
    'value' => 2,
    'period' => 'week',
]);
```

Whenever a membership for this plan is created, the limit is copied. To check if a user can register for another class this week, call:

```php
$service = app(PlanLimitService::class);
$canAttend = $service->checkAttendanceLimitForMembership($membership, now());
```

Use these helpers whenever you need to enforce limits on a membership, such as when adding sports or recording attendance.

For convenience the `Membership` model provides a `canAttendOn($occurrence)` helper that
internally uses `PlanLimitService`:

```php
if ($membership->canAttendOn($occurrence)) {
    // show attendance button
}
```
