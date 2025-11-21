# Mail Settings

Each club can configure its own SMTP server for sending emails. The configuration is stored per tenant using the `EmailSettings` class. All fields mirror the standard Laravel mail environment variables:

- `mailer` – transport driver (e.g. `smtp`, `log`).
- `scheme` – connection scheme (tls, ssl or null).
- `host` and `port` – server address and port.
- `username` – login user if required.
- `password` – encrypted in storage.
- `from_address` – the default **From** email address.

When switching tenants the `SwitchMailTask` applies these values to Laravel's mail configuration so outgoing messages use the club's server.

You can interactively set these values for a tenant by running:

```bash
php artisan tenant:configure-email-settings --tenant={id}
```
