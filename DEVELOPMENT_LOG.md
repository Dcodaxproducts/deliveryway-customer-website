# Development Log

## 2026-11-02 — guest table reservation form

- The reservation page now works without registration, login, or guest-login. It resolves restaurant scope from domain context, lists scoped branches, and submits to the public reservation endpoint.
- Added accessible full-name, email, and phone fields with browser autocomplete, inline localized EN/DE validation, responsive layout, and authenticated profile prefill when available.
- Submit payload includes normalized contact fields and a per-attempt UUID for duplicate protection. Existing date/time/opening-hours/closure/capacity UX and success states are preserved.
- No schema or cache impact. Verification: reservation validation tests, TypeScript, lint, production build, and full Vitest suite recorded with the commit handoff.
