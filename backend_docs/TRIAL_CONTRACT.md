# Trial Contract

Users booking a trial class must accept a contract before submitting the form.
The contract text is stored in the `contracts` table with the `type` set to `trial`.
Instead of a dedicated page, the contract is shown in a modal using the
`livewire.clubs.modals.trial-contract` component. The trial form provides a link
that opens this modal and requires the checkbox to be checked before
submission.

When the `allow_time_selection_in_trial` setting is enabled in
`ClubWebsiteSettings`, users are offered a list of upcoming class occurrences
right after the trial form is submitted. The list only includes future classes
and can be filtered by the discipline selected in the form.

The initial confirmation page lets the user know the request was sent and that
choosing a time is optional. After the user confirms a date, a second message
appears acknowledging the saved choice.

After submitting the form, a new `Lead` is created and a `ClubWebsiteTrialCreated`
event is dispatched. If time selection is enabled, users can choose an occurrence
for their trial class. The lead stores the optional `occurrence_id` field when a
time is confirmed. If no time is chosen, the lead remains without an occurrence
and the club can follow up manually.

When the form is submitted, the trial contract is also rendered to a PDF using the
same generator as the member onboarding contract. The PDF title comes from the
`contracts` table so clubs can customise it. The file name starts with a slugged
version of the contract title and is stored under `contracts/`. The full path is
saved in the `meta->contract_path` field of the `leads` table for later
reference. The meta data also includes `accepted_terms_at` with the exact time
the user agreed to the contract.
