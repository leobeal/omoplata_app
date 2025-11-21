# Rate Limiting

Omoplata protects different areas of the application with Laravel's built‑in rate limiter. The limits can be tuned through environment variables and are defined in `config/rate-limits.php`.
The limiters are registered in `App\Providers\RateLimiterServiceProvider`.

| Area   | Default limit |
|-------|---------------|
| admin  | 60 requests per minute |
| portal | 60 requests per minute |
| website| 120 requests per minute |
| auth   | 10 requests per minute |
| forms  | 5 requests per minute |

You can change these values by setting the `RATE_LIMIT_ADMIN`, `RATE_LIMIT_PORTAL`, `RATE_LIMIT_WEBSITE`, `RATE_LIMIT_AUTH` or `RATE_LIMIT_FORMS` variables in `.env`.

The rate limiters are applied to the corresponding route groups using the `throttle` middleware.
Because Livewire components make background requests after a page is loaded,
`ThrottleRequests` is registered as a persistent middleware so the same limits
apply to Livewire interactions as well.
