# Class Assignments

Some clubs require members to be assigned to specific time slots. This is controlled per class via the **requires_assignment** flag.

When enabled, members must be linked to specific time slots through the `clazz_user` pivot table. The pivot stores an `time_slots` array with the weekly references (e.g. `1-0`) chosen by the member for that class. These references correspond to the recurring schedule and not to individual dates.

Use `Membership::hasOccurrence()` to check if a membership is assigned to an occurrence and `Membership::canAttendOn($occurrence)` to enforce this rule.
