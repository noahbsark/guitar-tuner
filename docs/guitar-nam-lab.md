# Experimental Neural Amp Lab

This branch contains a separate local-file NAM experiment at /guitar-nam-lab.html. The separate lab itself does not enable speaker monitoring or microphone capture. An optional experimental NAM mode is now also available inside the main studio's amplifier section, using the same runtime. The built-in studio remains usable with no additional dependencies.

## Local setup (Node 22, npm and tar)

From the feature branch checkout:

```sh
node scripts/prepare-nam-engine.cjs
python3 -m http.server 8000
```

Open http://localhost:8000/guitar-nam-lab.html. On Windows, use py -m http.server 8000 if needed. The preparation script fetches exactly neural-amp-modeler-wasm@3.0.7 via npm pack (no lifecycle scripts), copies the engine and shared chunks into vendor/nam-runtime/dist, records the package integrity, and copies the package license. Generated assets are gitignored; a plain checkout or existing Cloudflare static preview without the preparation step will not contain the runtime. Do not change the production build settings to deploy this experiment yet.

Choose a legally usable .nam capture and a short local guitar recording, load the model and play. Start at low output. Compare original vs processed; choose the simple cabinet filter for amp-only models, or leave it off for amp-plus-cab captures. The real-time render records the modeled output with speaker monitoring muted. Its file format depends on MediaRecorder availability. The first lab supports short recordings (60 seconds), mono/stereo input, and model/AudioContext sample-rate matching. Browser support for model architectures, sample rates and codecs must be measured.

## License and distribution gate

- Engine: https://github.com/tone-3000/neural-amp-modeler-wasm (MIT upstream). The pinned npm package's license is copied by the preparation script.
- Core DSP: https://github.com/sdatkinson/NeuralAmpModelerCore (MIT).
- Additional compiled dependencies include Eigen and other core libraries. Before distributing the generated runtime publicly, verify the pinned build's complete source dependency versions, include all required notices and applicable corresponding-source availability. Do not assume the top-level MIT license covers everything in the wasm binary.
- Individual NAM captures and IR files have separate usage/redistribution rights. This project bundles no third-party guitar models, recordings or impulse responses. Browser tests use an original synthetic linear test model, not an actual amplifier capture.
- The TONE3000 API/catalog is separate from the open source engine. No API access, scraping, account or remote catalog is included. Review the current API terms and seek permission before any catalog integration.

## QA

The GitHub browser workflow stages the runtime before tests, validates the synthetic model and records an output where MediaRecorder exists. Review CI results, actual device compatibility, actual guitar listening, input/output levels and real-time load before replacing the existing amplifier. A test model verifies execution, not the quality of an amp capture. No user file is uploaded.

The future live integration must preserve the existing dry/wet recording paths, limiter, headphone gate, graph routing and fallback, and either support neural offline rendering or disable WAV export while the neural model is active.

## Main studio integration

With the runtime staged, open /guitar-amp.html and expand **Neural amp capture (experimental)** under the amplifier. Load a local licensed capture while playback and microphone are stopped. The studio context's native sample rate must match the capture. Full-rig captures bypass the studio cabinet, while amp-only captures retain the cabinet and custom IR path. Pre/post pedals, EQ, master volume, limiter, dry bypass and real-time recording are retained. Offline WAV and reference EQ are disabled while NAM is active to prevent rendering a different amp from the one heard. Return to the built-in amplifier to use those tools. Models are not persisted in saved rigs or shared links. Runtime failures stop monitoring and restore the built-in amplifier; input must be restarted manually. No model catalog or captures are distributed. Browser CI now also tests the actual neural signal ratio and restoration of the built-in route. The normal Firefox profile is retained; an additional test-only audio-permitted profile investigates suspended contexts without changing visitor browser behavior.
