# Graduation module overview

The graduation module keeps track of belt ladders for each discipline. Clubs can define separate ladders for kids, teens, and adults by duplicating belts and assigning the appropriate `audience` value.

## Core entities

- **Belts** – Belts belong directly to a discipline. They include a stable `code` that is used to derive translation keys, visual metadata (`belt_color_hex`, `icon`), sequencing information, and an `audience` column that stores one of `kids`, `teens`, or `adults`.
- **Belt requirements** – Stores per-belt promotion requirements as typed payloads. The initial implementation supports `minimum_months` and `minimum_stripes` requirements.
- **User belt progress** – Historical log of belts and stripe updates. The latest non-superseded record represents the member’s current belt status for the discipline and audience (kids vs. adults).

## Actions

- `AwardBeltAction` writes a new belt progress record, superseding the previous one within the same discipline/audience combination so that history remains intact.
- `AwardStripeAction` increments the member’s active belt progress record while keeping a complete history of stripe changes.
- `RecalculateEligiblePromotionsAction` scans members of a discipline for a specific audience (`kids`, `teens`, or `adults`) and evaluates belt requirements so staff can identify members who are ready for a promotion.

## Requirements format

Each belt requirement stores a `type` and a JSON `payload`. The following requirement types ship with the initial version:

- `minimum_months` – Ensures the member has held the current belt for at least the configured number of months.
- `minimum_stripes` – Requires that the current belt progress contains at least the configured stripe count before the next promotion.
- `minimum_classes_per_stripe` – Requires a specific number of classes between promotions. Historic training can be backfilled via attendance credits (see below).

Future requirement types can be added without schema changes by inserting new records with different `type` values and payload structures.

## Seeder defaults

Tenants that enable graduations automatically receive default belt ladders based on their discipline type (e.g., BJJ adults and kids). Seed data can override those defaults by providing a `graduation` section in the club seed configuration file. Each seeded belt sets the `audience` attribute to indicate which demographic it targets.

## Utilities

- `php artisan graduation:populate-belts` populates the default belt ladder for every graduation-enabled discipline that does not yet have belts defined. Pass `--only-with-classes` to restrict the sync to disciplines that already have scheduled classes, which is useful for tenants that only want belts for actively used disciplines.

## Attendance credits

When a belt is awarded staff can optionally record an "attendance credit" that represents past training sessions. Credits live in the `belt_attendance_credits` table and are scoped to the specific `user_belt_progress` record that created them, ensuring they only influence the current belt lifecycle. The `CountDisciplineAttendancesSinceAction` merges real attendance records with these credits so graduation requirements that rely on class counts continue to behave as expected without polluting historical attendance logs.
