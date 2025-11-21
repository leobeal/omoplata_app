# S3 Buckets

Omoplata stores tenant files on S3 compatible object storage. Sometimes it is
necessary to rename a folder inside a bucket, for example when a club changes
its slug.

## Renaming a folder

```bash
php artisan s3:rename-folder bucket-name old-folder new-folder --disk=hetzner --tenant=club-slug
```

The command copies all objects from the source folder to the destination
folder in the same bucket and removes the original folder. It is tenant aware
and will only run for tenants in onboarding or testing mode.
