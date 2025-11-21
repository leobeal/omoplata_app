# Stripe Webhook Handling Strategy

This document explains the design decisions and implementation details regarding how Stripe webhooks are handled within Omoplata.

## Overview

This document outlines the key questions considered and the rationale behind each decision.
---

## 1. **Where Should the Webhook Be Handled: Landlord or Tenant Database?**

### Decision:
**Webhooks are handled in the landlord database.**

### Reasoning:
- **Reliability**: If the logic to resolve the tenant is broken or misconfigured, the webhook would fail to be processed.

### Summary:
- Webhooks are always received and stored in the landlord database.
- Processing starts in the landlord context and only moves to the tenant context once the tenant is identified.
---

## 2. **How Are Tenants Identified in Webhooks?**

### Options Considered:
- Adding the `tenant_id` to every single Stripe call and expecting it back in the webhook payload.

### Why This Was Rejected:
- **Risk of Inconsistency**: Forgetting to include the `tenant_id` in a Stripe API call could lead to unresolvable webhooks.
- **Maintenance Overhead**: Increases the number of places where tenant information needs to be manually included.

### Final Decision:
**Use Stripe Connect's `account ID` (which is always present in webhook events).**

### Implementation:
- A table named `tenant_external_accounts` was created in the **landlord** database.
- This table maps an external service (e.g., Stripe) and an external account ID (e.g., Stripe account ID) to the internal tenant.

```text
Table: tenant_external_accounts
Columns:
- tenant_id
- name (e.g., 'stripe')
- account_id (e.g., 'acct_1234...')
```

We need to make sure we always create a new entry in this table when we create a new Stripe account for a tenant.
---

## 3. **Switching to Tenant Context**

Once the correct tenant is resolved via the Stripe `account ID`:
- The job sets the tenant context.
---

## Summary of the Flow

1. **Webhook is received** and stored in the landlord database. 
2. The ProcessStripeWebhookJob job (not tenant aware - check config/multitenancy.php not_tenant_aware_jobs) will fetch the weebhook from the landlord database, and point to the correct job to process it. If no job is configured, a default job will be called. Check `config/stripe-webhooks.php`
2. In the job, **Stripe account ID** is extracted from the webhook payload. tenant_external_accounts is queried and the current tenant is set.
5. Tenant-specific logic is **executed within the tenant database**.


## How to Test locally

1. **Set up Stripe CLI**: Make sure you have the Stripe CLI installed and configured.
2. `stripe listen --forward-to sportsmanager.test/api/strp/wbhk`
3. **Trigger a webhook**: Use the Stripe CLI to trigger a test webhook event and pass a --stripe-account For example:
   ```bash
   stripe trigger charge.failed --stripe-account=acct_1RBHmQE9yJHygyAM
   ```



```
payment_intent.created
payment_intent.payment_failed
charge.failed
payment_intent.processing
charge.pending
payment_intent.succeeded
charge.updated

charge.dispute.funds_withdrawn
charge.dispute.closed
charge.dispute.created
```
