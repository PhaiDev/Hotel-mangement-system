# AGENTS.md

## Purpose
This file defines how coding/design agents should work in this repository (`my-app`).

## Project Snapshot
- Stack: Next.js (App Router) + TypeScript + Tailwind CSS
- Main app area: `app/`
- Shared logic: `lib/`
- Public assets: `public/`

## Installed Skills
- `uxui` skill is installed locally at:
  - `~/.codex/skills/uxui`
- Use it for UI/UX ideation, layout improvements, and visual consistency work.

## Agent Working Rules
- Keep changes focused to the user request.
- Do not revert unrelated existing edits.
- Prefer minimal, safe diffs over broad refactors.
- Preserve Thai UI copy and existing domain terms.
- For UI changes, keep desktop and mobile behavior valid.

## Code Style
- Use TypeScript strict-safe patterns.
- Avoid introducing `any` unless unavoidable.
- Prefer small reusable helpers for repeated logic.
- Keep comments brief and only where needed.

## Validation Before Handoff
- Run targeted checks when possible:
  - `npm run lint`
  - `npm run build` (when needed for confidence)
- If checks cannot run, report that explicitly.

## UI/UX Guidance
- Match the existing visual language unless user asks for redesign.
- For popups/forms:
  - clear hierarchy
  - strong CTA contrast
  - accessible input states
  - responsive spacing and typography
- Always provide fallback for broken/missing image URLs.

## File Change Notes
When finishing a task, include:
- files changed
- what behavior changed
- any follow-up risks or TODOs
