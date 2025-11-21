# Roles and Permissions

Use the following command to create a permission and assign it to a role for one or all tenants:

```bash
php artisan permission:create {role} {permission} [--tenant=<id>]
```

If the `--tenant` option is omitted, the command runs for **all** tenants (the default is `*`). The output shows a table indicating if the permission already existed and whether the role already had it.
