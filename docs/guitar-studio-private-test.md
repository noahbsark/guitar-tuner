# Private hands-on guitar studio test

This guide is for the owner's local evaluation only. Do not merge the draft pull request or change Cloudflare production settings.

## Start a local test

1. Download or clone the feature branch `feature/virtual-guitar-amp` from https://github.com/noahbsark/guitar-tuner/archive/refs/heads/feature/virtual-guitar-amp.zip.
2. Extract the archive. Open a terminal in the extracted repository root.
3. For the neural models, install Node.js 22 (with npm), then run `node scripts/prepare-nam-engine.cjs`. The script fetches the pinned runtime and verifies its package integrity. The classic amp works without this step.
4. Start a local server bound only to loopback: `python3 -m http.server 8000 --bind 127.0.0.1` (Windows: `py -m http.server 8000 --bind 127.0.0.1`).
5. Open http://localhost:8000/guitar-amp.html. Use the same URL each time for the browser's local recording library. Do not expose this development server to the Internet or a LAN. For actual phone microphone tests, a separate secure, access-controlled HTTPS preview is needed.

## Hands-on test sequence

- Demo: play the generated recording, compare original and processed, try each of the nine conventional presets and four neural models. Start with low output.
- Mic: start record-only mode; play a short acoustic guitar passage. Record a take, finish, confirm mic stops, preview original and processed, download both. Repeat with unplugged electric and direct pickup recordings if available.
- Library: name and explicitly save a take. Reload, verify it remains, trim a 2–3 second excerpt with fades, download the copy, verify the original is unchanged. Delete a disposable test take and confirm it stays deleted after reload.
- Camera: enable only after starting mic. Record a visible and audible pluck or clap for sync; finish, check camera and mic have stopped. Preview and download video and standalone audio. Test camera denial and video trim where supported.
- Headphones: choose live monitoring only when wearing headphones at low volume. Verify emergency stop, cancellation while permission is pending and backgrounding. Never test speaker feedback by increasing volume.
- Mobile: test real iPhone Safari and Android Chrome only on a secure private test host. Automated mobile WebKit emulation is not a physical device.

## Record test evidence

For each test record browser/version, device and OS, guitar/input type, mode/model, pass/fail, observed problem, and whether downloads play in another player. Include screenshots only when they do not expose private recordings or people without consent.

## Current blockers

Browser CI has reached 56 passes, 2 failures and 5 skips (run 46039634476). Both failures were WebKit: binary recording storage fixture and late microphone permission fixture. The subsequent change stores new recordings as ArrayBuffers with MIME metadata and reads legacy Blob records; the test mock is installed after page initialization. Verify the new run before marking either fixed. Actual WebKit camera/mic recording remains unverified. All four neural models loaded in the prior browser run, but real listening and runtime compiled-dependency licensing remain release gates.

Do not make public release, SEO, or monetization changes during this test.