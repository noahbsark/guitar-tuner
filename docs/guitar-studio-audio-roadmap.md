# Guitar studio audio roadmap

## Browser DSP beta
The current tool is dependency-free Web Audio. Input compensation and pickup-color EQ are heuristic, not pickup reconstruction. Hum filters and an adaptive gate suppress specific noise and quiet signals, not competing music. Reference EQ estimates relative spectral balance over the first ten seconds; use comparable guitar performances. It does not identify real equipment.

## Neural modeling feasibility
The open source Neural Amp Modeler project (https://github.com/sdatkinson/neural-amp-modeler) and TONE3000 browser port (https://github.com/tone-3000/neural-amp-modeler-wasm) provide a credible route to browser inference, including a standalone engine API documented at https://github.com/tone-3000/neural-amp-modeler-wasm/blob/main/ui/README.md. Before integration:
- Pin a tested engine release, audit its license and dependencies, and self-host required assets with notices. Check individual model and IR licensing separately; open source engine rights do not grant rights to every capture.
- Verify that engine supports routing from our existing mic/file graph and exporting its processed signal, not just a separate player. Test WebKit and mobile memory, sample rate conversion, processing deadline misses and fallback.
- First offer local user-selected licensed captures; bundle only owned or appropriately licensed files, and distinguish amp-only captures from amp-plus-cabinet captures. Avoid double cabinet coloration.
- Measure input-to-output delay, silence, transients, dynamics, noise and output clipping. Compare real direct guitar and mic-recorded guitar; a model trained to reamp direct pickup input is not trained to reconstruct pickup sound from microphone audio.
- Genuine acoustic-to-pickup conversion needs paired, aligned recordings (ideally simultaneous microphone and magnetic pickup tracks), appropriate rights, a model that preserves timing and pitch, and blind listening evaluation. Source separation is another independent task.

## Release gates
- Run `node scripts/guitar-amp-smoke.cjs` and review CI. Mock tests check state and routing only; they do not render audio.
- Test real guitar microphone, direct input, headphone safety, stop/permission errors, latency, file playback, routing changes, IR loading, reference EQ, WAV playback, media recorder video sync, export cancellation and background behavior on desktop Chrome/Firefox and mobile Chrome/Safari.
- Verify current retailer products, links, affiliate disclosure and applicable program rules. Avoid claims of exact physical gear equivalence.
- Keep unindexed and unlinked until reviewed; then add navigation, sitemap, privacy disclosures and canonical public page. No production/DNS changes until review.
- PWA, public community, user accounts, retailer APIs, sponsored presets and paid infrastructure require separate scope and validation.

## Performance video capture (implemented on the feature branch)

After explicitly enabling the microphone, a user may enable the camera, view a muted local preview, and record a take. Camera permission requests video only. The video recorder receives the camera video track plus the existing processed audio bus, never a second microphone track; original and processed audio are also recorded separately. Video is limited to two minutes, requests up to 720p/30fps (24fps preferred), and requests a 1.5 Mbps video bitrate. Codec, actual resolution, bitrate and A/V alignment are browser-dependent. The five-take in-tab limit still applies. Finishing, disconnecting, switching inputs or hiding the tab releases camera and microphone tracks; permission failure leaves audio recording available. Preview and downloads are local and require no upload. MediaRecorder chooses a supported WebM or MP4 container; there is no guarantee of MP4 on every device.

Before release: verify the video test with real browser encoders; test camera permission denial, front/rear camera differences, mobile orientation, audio/video synchronization using a visible/audible pluck or clap, stop during permission prompt, long recording resource limits and downloaded video playback on actual devices. Existing record-only microphone mode remains the default. No persistent recording library yet.
