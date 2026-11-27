# Neural runtime third-party review (development only)

## Identified source revisions

The downloaded npm package is `neural-amp-modeler-wasm@3.0.7`. CI run [46040555996](https://github.com/noahbsark/guitar-tuner/actions/runs/46040555996) verified its actual tarball SHA-512, recorded the registry gitHead, fetched the source commit and resolved the NAM Core Git submodule. Its artifact contains the exact manifest and provenance report. The following source identities were verified from that report and pinned upstream source files:

| Component | Exact version or revision | Source / notice |
|---|---|---|
| TONE3000 NAM WASM | ea8dc285462d6cedd982691b9f090cd03dac04a2 | [Source](https://github.com/tone-3000/neural-amp-modeler-wasm/tree/ea8dc285462d6cedd982691b9f090cd03dac04a2), NAM-WASM-SOURCE-LICENSE.txt (MIT) |
| NeuralAmpModelerCore | 1f42f88535884450104b8711d7595019afa0495b | [Source](https://github.com/sdatkinson/NeuralAmpModelerCore/tree/1f42f88535884450104b8711d7595019afa0495b), NAM-CORE-LICENSE.txt (MIT) |
| nlohmann JSON | 3.12.0; header Git blob 82d69f7c5d044c9887c96b90c97f5639083ecd14 | [Vendored header](https://github.com/sdatkinson/NeuralAmpModelerCore/blob/1f42f88535884450104b8711d7595019afa0495b/Dependencies/nlohmann/json.hpp), NLOHMANN-JSON-LICENSE.txt (MIT) |
| Eigen | bc3b39870ecb690a623a3f49149a358b95c5781d | [Pinned source](https://gitlab.com/libeigen/eigen/-/tree/bc3b39870ecb690a623a3f49149a358b95c5781d); exact license inventory and accessibility require confirmation |
| AudioDSPTools | 0827c6c2fc0deced568536142ea86f189e0b98a1 | [Pinned source](https://github.com/sdatkinson/AudioDSPTools/tree/0827c6c2fc0deced568536142ea86f189e0b98a1); presence in core source tree, not confirmed to be linked |
| Emscripten / LLVM / libc / libc++ | Exact packaged compiler and runtime revision not attested | [Toolchain licensing](https://emscripten.org/docs/introducing_emscripten/emscripten_license.html) |

The pinned WASM CMake file compiles NAM Core's NAM/*.cpp, with Eigen and JSON headers in its include path. The engine bundle includes generated Emscripten glue. The upstream README says tested with Emscripten 6.0.x, but does not establish the compiler version used for this npm binary. No public distribution approval is implied.

## Outstanding distribution gate

- Preserve original notices for all actual compiled components. Verify Eigen's exact source and relevant file-level licensing; make covered source accessible to recipients and provide a source-availability notice where required by [MPL 2.0 §3.2](https://www.mozilla.org/en-US/MPL/2.0/).
- Verify the exact runtime/toolchain component versions and applicable notices; inspect the JavaScript/source-map dependency closure of the staged engine. A registry gitHead and integrity hash are not a reproducible-build attestation.
- If upstream cannot provide build provenance or the license bundle, use a reproducible build from the pinned source with known toolchain versions and audited notices; re-run audio tests before adopting the replacement. Do not bypass this gate.
- Model licenses are separate; see ../../nam-models/NOTICE.md (relative to the repository's vendor directory).
- This file is review evidence, not legal advice or a claim of full clearance. Do not publicly host the generated runtime until reviewed.

Local owner testing can use the existing preparation script; no new runtime binary is committed.
