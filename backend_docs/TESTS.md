# Testing

To run the automated tests execute:

```bash
php artisan test
```

The test suite uses a `RefreshMultiTenantDatabase` trait which sets up the multi-tenant databases. This trait now prints the memory usage for each test before and after Laravel destroys the application. The output helps catching possible memory leaks.
