# Cloudflare Pages migration

The domain stays registered with Cloudflare. GitHub remains the source repository
and runs the existing scheduled publisher. Cloudflare Pages hosts the website.

## Create the Pages project

In Cloudflare, choose Workers & Pages, create an application, and select Pages
with Git integration. Connect only noahbsark/guitar-tuner when selecting repository
access. Use these settings:

| Setting | Value |
| --- | --- |
| Production branch | main |
| Framework preset | None |
| Build command | exit 0 |
| Build output directory | / (repository root) |
| Root directory | Leave blank |
| Automatic production deployments | Enabled |
| Preview branch deployments | None |

Disable preview branch deployments before pushing to content-queue. That branch
contains unpublished drafts and must not be deployed as a preview website.

The repository already contains deployable HTML, CSS and JavaScript. There is no
package installation or framework build. The root 404.html makes unknown paths
return a missing-page response instead of Cloudflare Pages' default SPA fallback.
Cloudflare Pages redirects .html paths to extensionless paths; follow redirects
when checking existing article links and canonical URLs.

## Verify before changing DNS

Open the assigned pages.dev address. Check the homepage, a tuner page, a guide,
styles.css, tuner.js, ads.txt, robots.txt, sitemap.xml, and the IndexNow key file.
Check that a deliberately nonexistent path returns HTTP 404.
Test microphone tuning in a real browser over HTTPS.

## Move the domain

1. Record the current apex and www DNS records and GitHub Pages settings for rollback.
2. Add onlineguitartuner.net in the Pages project's Custom domains section first.
   Let the custom-domain setup create or replace the relevant DNS record.
   Do not merely create a CNAME without associating the domain with Pages.
3. Add www.onlineguitartuner.net too, or configure a permanent redirect from www
   to the apex. Preserve unrelated email and verification DNS records.
4. Wait for the custom domain and certificate to become active, then verify both
   HTTP and HTTPS, apex and www, article URLs, ads.txt, robots.txt, and sitemap.xml.
5. Verify a real scheduled publication produces a Cloudflare production deployment.
   The GitHub publisher commits due content to main; Pages Git integration should
   deploy that push. If it does not, investigate the integration before relying
   on unattended publishing.
6. Keep GitHub Pages available until these checks pass. Afterward, remove its
   custom-domain binding and disable its old deployment if desired.

Rollback: restore the recorded DNS records and the GitHub Pages custom-domain
configuration. Do not delete the working Cloudflare deployment while diagnosing.

## Scheduled publishing inventory (2026-11-11)

The existing workflow runs Sunday, Monday, Wednesday and Friday at 09:00
America/Chicago. GitHub may delay scheduled runs; these times are not guarantees.
The upcoming active queue is Monday/Wednesday/Friday.

- 68 entries in publication-queue.json on content-queue.
- 54 entries already have their destination page on main.
- All 14 remaining entries have completed source files and dates from
  2026-11-13 through 2026-12-14. None is overdue as of this inventory.
- The larger editorial calendar contains 120 later planned topics through
  2027-09-20 without source files. They are not active publication jobs.

Keep the existing queue and workflow. There is no need for a second scheduler.
Later topics need completed, reviewed HTML before promotion into
publication-queue.json. The publisher only reads that active manifest.
The existing workflow's "Wait for GitHub Pages" step actually checks the public
custom-domain URLs and is host-independent despite its label.

## AdSense review

The reported "Site down or unavailable" and "ads.txt: Not found" statuses are
AdSense issues. A hosting migration does not guarantee approval.

The repository already has a permissive robots.txt, AdSense tags in queued-page
validation, and ads.txt with pub-6136525087204092. Confirm that publisher ID matches
the AdSense account. Repository presence does not prove public crawler access.

Before requesting another review, confirm the live domain serves:
- A public homepage with useful HTML content and the correct AdSense verification.
- ads.txt as plain text with HTTP 200 and the correct publisher record.
- robots.txt without blocking Google advertising crawlers.
- Working HTTPS, redirects, and article links without authentication or challenges.

Inspect Cloudflare security events for actual blocked Google crawler requests
rather than disabling security settings broadly. Check Google's current site
status details, then request review on the existing site entry once the live
checks pass. Avoid removing and re-adding the site during review.

## References

- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/configuration/git-integration/
- https://developers.cloudflare.com/pages/configuration/branch-build-controls/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developers.cloudflare.com/pages/configuration/serving-pages/
- https://support.google.com/adsense/answer/7584263
- https://support.google.com/adsense/answer/7679060
