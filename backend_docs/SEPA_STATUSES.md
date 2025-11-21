# SEPA XML statuses

SEPA XML files go through a small lifecycle.

- **pending** – file was created but not yet uploaded to the bank.
- **uploaded** – file was uploaded to the bank for processing.
- **processed** – the bank confirmed processing of the file.
- **error** – an issue occurred and manual intervention is required.

Changing the status logs a `sepa_xml_status_updated` activity entry.
