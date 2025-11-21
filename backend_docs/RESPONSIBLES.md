# Responsible Users

The `responsible` role is used for parents or guardians of minor members. These users can log in to the portal to view information about their children.

## Portal Access

`responsible` users receive the same portal permissions as regular members. When they sign in they see a list of their children on the dashboard with each child's active membership.

If the responsible user doesn't also hold the `member` role, the dashboard hides the usual member widgets and only displays information related to their children. The **Billing** page always shows the responsible's own payment methods because charges are issued to them.

Administrators can view all dependents of a responsible from the **Dependents** tab in the member area of the app.
## Attendance Intentions

Responsible users can confirm or decline upcoming classes for each child directly from the dashboard. The next three sessions per child are listed with the same yes/no/maybe options available to members.

## Removing a Responsible

In the staff-facing app, adult members include a **Remove responsible** button on the profile form whenever a responsible is linked to their account. A confirmation modal explains the billing changes and, once confirmed, the system detaches the relationship and:

- Moves any stored payment methods from the responsible back to the member so future charges target the member directly.
- Updates the member's memberships so the `payer_id` is set to the member instead of the former responsible.

Clearing the responsible fields alone will not remove the responsible. Members who are still minors must keep a responsible on file—the relationship and billing assignments remain untouched. The member portal never shows the removal button, so adult members need to contact the academy to detach a responsible.
