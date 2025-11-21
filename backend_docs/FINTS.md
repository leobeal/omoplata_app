# FinTS

Omoplata integrates with German banks using the FinTS protocol. Credentials are stored encrypted with a PIN chosen by the administrator.

## Settings

1. Fill in bank URL, bank code, username and password.
2. Click **Save**. A modal prompts for a PIN which encrypts the credentials. The application then fetches available TAN modes and accounts. If fetching fails, no data is stored and an error notification appears.
3. After TAN modes and accounts are loaded a second form lets you select the TAN mode, TAN medium and default account. These options can be saved independently of the credentials.

## Flow

FinTS operations—such as fetching accounts, retrieving transactions or sending a raw XML request—authenticate in stages. The application keeps track of the action that triggered a challenge so it can resume after verification.

1. The user triggers an action.
2. A modal prompts for the PIN created when the credentials were first saved. This PIN decrypts the stored bank username and password.
3. The action runs with the decrypted credentials. If the bank requires additional authentication, the service serialises the pending action together with the FinTS session.
4. When the selected TAN mode is decoupled (for example, pushTAN), a modal asks the user to confirm the operation in the bank's app. The modal can automatically poll the bank for confirmation or let the user manually trigger the check.
5. For classic TAN modes the service shows a challenge image and waits for the user to enter the TAN.
6. After verification, the service restores the original state, submits the TAN and completes the stored action.
7. The result of the action is returned and the UI continues normally.
