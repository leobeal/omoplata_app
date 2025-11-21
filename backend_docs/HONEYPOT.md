# Honeypot Protection

The contact and trial forms use a simple honeypot field named `website` to catch bots. The input is hidden from real users. If the field contains any value when the form is submitted, Omoplata assumes the request came from an automated script. In that case the form submission is acknowledged but no lead or contact record is created.

This prevents obvious spam without introducing captchas or additional steps for genuine visitors.
