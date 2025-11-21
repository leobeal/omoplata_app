## Members

## How to identify the member as a "child" (someone who neeeds a responsible)
If user does not have a date of birth, we check wether they have or not a responsible.
otherwise, we fetch the age and try to find the correct user demographic based on max and min age.

When creating a child who requires a responsible, the member email may be left blank but if provided it **must differ** from the responsible's email. This avoids duplicate logins when guardians manage multiple members.

### Statistics
The members index page displays various statistics:

- **Active Members**: total number of members with an active membership. The subtext shows how many joined {{ __('members.list.this_month') }}.
- **Lost Members**: members who cancelled their memberships {{ __('members.list.last_30_days') }}.
- **At-Risk Members**: active members without any class attendance in the last 30 days.
- **Prospects**: number of leads with status `new`.

### Cancelling a membership
In the *Edit Membership* modal click **Cancel Membership** to reveal the end
date field. Choose a date and confirm the cancellation. The membership status
changes to `cancellation scheduled` until the chosen date passes. No additional
job is required—the membership automatically becomes inactive after the chosen
date. The scheduled end date is displayed throughout the app and portal.

### Managing Sports, Classes or Time Slots
Depending on the `membership_selection_mode` setting, members manage either their sports, their classes or specific weekly **time slots** from the portal profile page. The current membership limits how many items can be selected. When the limit is reached, new options cannot be added. Administrators can override this limit when editing the member through the app.

Portal profiles also collect a phone number (country code and phone) to contact members directly.

The members list now shows the last online information right under each member's name (and the responsible's name, when applicable). A green dot highlights users that are currently online.

