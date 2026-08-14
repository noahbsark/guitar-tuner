# Scheduled content queue

This branch stores articles before they are published to the live site.

## Add an article

1. Create the complete reviewed HTML page at `scheduled/<slug>.html`.
2. Ensure its filename matches the corresponding `source` in `publication-queue.json`.
3. Include the site's canonical URL, Analytics tag, AdSense tag, stylesheet, navigation, and relevant internal links.
4. Commit the draft to this `content-queue` branch.

The workflow on `main` runs at 9:00 a.m. America/Chicago every scheduled publication day. It publishes due files, updates the homepage and sitemap, deploys through GitHub Pages, and notifies IndexNow.

If a scheduled source file is missing, the workflow safely skips it and tries again on the next scheduled run. Use the workflow's manual dispatch button to publish overdue completed drafts immediately.

