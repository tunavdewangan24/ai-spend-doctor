# DEVLOG

## Day 1 — 2026-05-06

**Hours worked:** 2

**What I did:**  
Built the first landing page and basic AI spend audit form.

**What I learned:**  
I learned how to structure the project as a real SaaS lead-generation tool.

**Blockers / what I'm stuck on:**  
Audit logic still needs to be moved into a separate tested file.

**Plan for tomorrow:**  
Add audit engine and write tests.


Day 2 — 2026-05-07

Hours worked: 2

What I did:
Separated the audit calculation logic into a dedicated audit engine file and added automated tests for pricing lookup, extra seats, small-team downgrades, high API spend, optimized spend, and annual savings.

What I learned:
I learned that business logic should not stay only inside the UI. Keeping audit rules in a separate file makes the app easier to test, debug, and explain during a code walkthrough.

Blockers / what I'm stuck on:
The current pricing values still need to be verified from official vendor pricing pages and documented in PRICING_DATA.md.

Plan for tomorrow:
Connect lead capture to a real backend using Supabase and prepare the database table for audit submissions.