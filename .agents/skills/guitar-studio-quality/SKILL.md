---
name: guitar-studio-quality
description: Build, audit and polish the Online Guitar Tuner guitar studio, including audio UX, responsive design, accessibility, testing and affiliate boundaries.
---

# Guitar studio quality

Read the project's PRODUCT.md and DESIGN.md (under docs/) before changing the studio. Use the installed frontend-design and web-interface-guidelines skills for UI; systematic-debugging for failures. This original project skill draws on the public Impeccable and UI/UX Pro Max approaches without installing executable launchers or external hooks.

## Shape
Start with the player's job: choose a source, hear a tone, tweak, save/export. Sketch the smallest usable path and an empty/error/loading state. Give the instrument and recording transport visual priority. Do not force accounts, shopping or advanced controls.

## Audit and critique
Check rendered desktop and mobile views, visual hierarchy, readable text, contrast, 44px primary touch targets, keyboard focus and meaningful accessible names. Native controls remain available when custom knobs or waveforms are used. Check first-use guidance and recoverable errors. Avoid decorative motion, excessive borders and technical vocabulary. Assess one visual issue at a time, then make a focused fix and verify it.

## Audio and trust
Never turn on the microphone or speakers automatically. Keep live monitoring headphones-only unless actual device stability is demonstrated. Preserve record-only mode. Keep user audio local, avoid false AI/gear equivalence claims, and document model/IR rights separately. Test signal routing, bypass, clipping, permission rejection, stop, export and mobile resource limits. Browser checks do not replace listening tests.

## Delivery
Run the mock test and browser tests, inspect screenshots, report exact failures and limitations. No production deploy or publishing changes without approval. Review new dependencies and pin versions. Do not execute third-party installers, hooks, downloaded binaries or tools with disabled sandbox/approval controls without review and explicit authorization.

## Upstream resources
- https://github.com/pbakaus/impeccable (Apache-2.0; full toolkit not installed)
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT; search scripts/data not installed)
- https://github.com/anthropics/skills/tree/main/skills/frontend-design
- https://github.com/vercel-labs/web-interface-guidelines
- https://github.com/obra/superpowers/tree/main/skills/systematic-debugging
