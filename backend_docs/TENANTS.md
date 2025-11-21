# Tenant creation

Tenants have their own database and now also their own object storage bucket. When a tenant is created a bucket named `<prefix>-<env>-<slug>` is created in the Hetzner object storage.

The bucket name is derived from the Hetzner bucket prefix and the current environment. It is not stored in the `tenants` table but calculated on demand by `SwitchStorageTask` when a tenant becomes current.

The task sets the `hetzner` disk as the default filesystem and points it to the tenant bucket.

## Uploading files

Use the `support:upload-folder` command to upload a directory to a tenant bucket:

```bash
php artisan support:upload-folder path/to/folder \
    --tenant=1 [--bucket-name=my-bucket] [--bucket-path=my/custom/path]
```

Omit `--bucket-name` to use the bucket configured for the selected tenant.
`--tenant` defaults to `null`, meaning the command runs for the current tenant.
`--bucket-path` allows uploading to a subdirectory inside the bucket instead of the root.
