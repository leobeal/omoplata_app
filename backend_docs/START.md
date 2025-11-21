This document discuss the user migration process, and the first run to generate payments.
We will discuss the steps that we will follow, the things that can go wrong, and what we need to pay attention to:


# Import
- Run `php artisan magicline:import {path} --tenant={slug} [--skip={n}]` to parse MagicLine `master_data.xlsx` spreadsheets, skipping the first `n` folders if provided.
- Plans, users and memberships will be created.
- We want to run the command that will create transactions for the last year.
- We want to also import expenses, and create transactions for them.


- [ ] All users are imported, plans are created, memberships, payer is set - create a command to describe and check all.
- [ ] All last_charged_at is correctly set. This is SUPER important. There is a mechanism to avoid creating multiple transactions for the same user.
- [ ] A dry run points that the payments are due to.
-
