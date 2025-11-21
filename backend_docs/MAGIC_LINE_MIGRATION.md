This document describes how to migrate data from MagicLine into Omoplata.

- Run `php artisan magicline:import {path} --tenant={slug} [--skip={n}]` to parse MagicLine `master_data.xlsx` spreadsheets and create plans, users and memberships.
- Run `php artisan copy-profile-image` to copy profile pictures from the local environment to the production bucket.
- Ensure that `last_charged_at` is correctly set to avoid creating duplicate transactions when generating payments.
