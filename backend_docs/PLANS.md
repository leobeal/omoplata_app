# Plans and Pricing Module Technical Documentation

## Overview

This module manages membership plans and pricing options for clubs, offering a flexible recurring billing system. It distinguishes between behavioral rules (handled by fixed User Demographics) and pricing rules (managed via Age Groups), while allowing clubs to set contract durations and billing frequencies. The design also supports family plans and specialized pricing (such as student discounts) without overcomplicating the core data model.

---

## Key Concepts

### Plans
- **Definition:**  
  A Plan represents a core service (e.g., “Jiu-Jitsu”) offered by the club.
- **Behavior:**  
  Each plan is associated with a fixed **User Demographic** (e.g., Kid, Adult, Family). This linkage defines the plan’s behavioral rules (for instance, who can self-pay or if a guardian is required).
- **Usage:**  
  Plans are the high-level offerings that clubs create and manage, and they are intended to be broad enough to cover a service for all users within that demographic.

### Plan Prices
- **Definition:**  
  Plan Prices define specific pricing options for a plan. They capture variations in pricing based on the contract duration (overall term) and the charge frequency (how often billing occurs).
- **Age Group Association:**  
  Instead of tying pricing variations directly to a user demographic, Plan Prices are linked to **Age Groups**. This separation allows you to manage pricing tiers (for example, different price levels for younger kids versus older kids) independently of the behavioral rules.
- **Usage:**  
  When a user signs up or when an admin creates a membership, the system uses the user’s age (or calculated Age Group) to determine the appropriate plan price within the broader plan.

### User Demographics
- **Definition:**  
  User Demographics are fixed behavioral categories (e.g., Kid, Adult, Family). They drive rules such as payment responsibilities, self-pay eligibility, and platform access.
- **Immutable Nature:**  
  They are set at a system level (or by default by the club) and should not be arbitrarily created or modified by individual clubs. Their purpose is to maintain consistency in behavior across the system.

### Age Groups
- **Definition:**  
  Age Groups define discrete, configurable age ranges (for example, “Mini Kids”, “Junior Kids”, “Teen”) that determine pricing tiers and class eligibility.
- **Association:**  
  Age Groups are linked to a specific User Demographic (e.g., only “Kids” have associated age groups). This relationship ensures that pricing rules apply correctly based on a user’s actual age, without conflating that with behavioral rules.
- **Usage:**  
  When selecting a Plan Price, the system uses the member’s age to automatically select the matching Age Group, thereby determining the correct price.

### Recurring Billing
- **Contract Duration:**  
  This field defines the overall term of the membership (for example, “2 years”). It is typically stored as an ISO 8601 duration (e.g., “P2Y”) or defined via explicit start and end dates.
- **Charge Frequency:**  
  This defines how often the member is billed (for example, “monthly”). It can be stored as a simple ISO 8601 duration (e.g., “P1M”) or as an RRULE (e.g., `"FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=5"`) to allow for more advanced scheduling (such as ensuring billing occurs on a specific day of the month).
- **RRULE Usage:**  
  Membership records include an RRULE string that drives recurring billing, enabling complex rules while keeping the logic maintainable.

### Special Pricing – Student Discounts
- **Approach:**  
  Students are not modeled as a separate behavioral demographic. Instead, student discounts are handled as a pricing adjustment or discount rule. This means that while a student is treated like an adult in terms of behavior, they qualify for a reduced price through a discount mechanism rather than a different demographic.

---

## Relationships and Business Logic

- **Plan–User Demographic Link:**  
  Each Plan is tied to a User Demographic to enforce behavior (e.g., a “Kids” plan will only be available to users classified as Kids).

- **Plan Price–Age Group Association:**  
  Plan Prices are further segmented by Age Groups. For example, within a “Kids” plan, different age groups (such as “Mini Kids” vs. “Junior Kids”) can have distinct prices.

- **Membership Creation:**  
  When a membership is created:
    - The plan is selected based on the User Demographic.
    - The appropriate Plan Price is determined by matching the user's age to the correct Age Group.
    - Recurring billing rules are applied via an RRULE stored in the membership record.
    - The membership includes a single payer (typically a parent for kids) and one or more participants.

- **UI Simplification:**
  In the pricing UI, if there is only one active option per pricing rule (i.e., one Contract Duration, one Charge Frequency, and one Age Group for a given demographic), the system automatically selects that option and shows a simplified input. Otherwise, it presents a dropdown for selection.

- **Price Display Order:**
  Within each plan the UI groups regular and special prices into separate lists. Regular prices appear first with a “Regular Prices” heading. Any discounts are listed below under “Special Prices.” This structure keeps the selection tidy.

- **Validation:**  
  Validation rules ensure that there are no duplicate pricing configurations (i.e., the combination of Contract Duration, Charge Frequency, and Age Group must be unique per plan). This prevents confusion and ensures that the UI can automatically simplify when only one option is available.

- **Administration:**  
  Admins are provided with dedicated flows for creating memberships:
    - “Adult Membership”
    - “Kid’s Membership” (with enforced parent as payer)
    - “Family Membership” (with one designated payer and additional participants)

  For member self-service, the initial flow asks whether the membership is for “Just me,” “My child,” or “My family,” then automatically applies the appropriate plan and pricing tier based on the user's demographic and age.

---

## Conclusion

This design cleanly separates behavioral logic from pricing logic:

- **User Demographics** define who a user is (Kid, Adult, Family) and enforce platform rules.
- **Age Groups** define pricing tiers and class eligibility, letting clubs manage detailed pricing based on age without affecting behavior.
- **Plans** are associated with a fixed User Demographic, ensuring consistency in how membership plans are offered.
- Accepting New Members
  - Plans have an `accepts_new_members` flag. Existing memberships remain valid when this is set to `false`, but such plans do not appear in plan selection lists.
- **Plan Prices** vary by contract duration and charge frequency, and are further refined by Age Groups.
- **Recurring Billing** is managed via RRULEs, providing advanced scheduling while keeping the billing process flexible.
- **Student Discounts** are handled as pricing adjustments rather than separate demographics.

This approach meets your requirements for flexible pricing, clear behavioral rules, and an intuitive UI for both admins and members.
