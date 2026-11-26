# Repository agent guidance

For changes to the virtual guitar studio, read docs/PRODUCT.md and docs/DESIGN.md and .agents/skills/guitar-studio-quality/SKILL.md. For interface changes read the installed frontend-design and web-interface-guidelines skills; for bugs use systematic-debugging and its supporting notes. Treat upstream examples as guidance, not permission to run installers or change unrelated code.

Preserve the original guitar tuner, content publishing workflow, Cloudflare production settings, and existing affiliate disclosure. Keep experimental changes on the guitar studio feature branch unless the owner explicitly authorizes release.

Validate with node scripts/guitar-amp-smoke.cjs and, when dependencies and browsers are available, the Playwright suite under .github/studio-tests. Review real screenshots at desktop and mobile sizes. Report what ran and what remains unverified. Do not claim audio quality, feedback suppression, or mobile compatibility solely from mock tests.
