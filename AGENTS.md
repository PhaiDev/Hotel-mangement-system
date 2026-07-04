# AGENTS.md

## Purpose
This repository is a Next.js 16 + Supabase hotel management system. AI agents should follow the existing architecture and keep changes small, consistent, and production-safe.

## Core Working Rules
- Prefer reading existing files before editing.
- Follow the existing layered structure:
  - UI/page changes in app/admin or components
  - API logic in app/api
  - Business rules in lib/services
  - Database access in lib/repositories
  - Input validation in lib/validators
  - Shared types in lib/types
- Avoid calling Supabase directly from frontend pages when server-side API routes already exist.
- Keep Thai UI copy consistent and avoid introducing new wording patterns unless necessary.

## Recommended Skill Areas for This Repo
1. Feature implementation
   - Add/update admin pages, modals, and UI flows.
   - Reuse existing components where possible.
2. API and service refactor
   - Move logic from page/components into API routes and services.
   - Keep response shape consistent.
3. Booking and room business rules
   - Handle overlap checks, status changes, pricing, and room availability.
4. Import/export and data migration
   - Work with Excel/CSV import flows and persistence logic.
5. Debugging and verification
   - Reproduce issues, inspect logs, and verify with lint/build when relevant.

## Token-Saving Guidance
- Do not re-explain the whole architecture for every task.
- Use the existing file patterns instead of inventing new ones.
- Ask for clarification only when the request touches business rules, data model, or UX decisions.
- Prefer small, targeted edits over large rewrites.

## Change Checklist
Before finishing a task, verify:
- The relevant existing pattern was followed.
- Types/validators/services/API routes were updated if needed.
- The change does not break the admin flow.
- Lint or build verification was attempted when appropriate.
