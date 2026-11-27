# Virtual Guitar Studio design system

Visual direction: a compact physical guitar rig translated into a modern accessible web instrument. Use a restrained charcoal enclosure, warm amplifier metal, clear mint active indicators, and muted pedal colors. Avoid generic marketing cards and excessive decorative labels.

Tokens: background #0c1016, panel #151c25, boundary #303b48, main text #edf2f7, muted text #a9b6c6, active #8ce4ad, amplifier accent #f0c67a. Use system UI type for fast loading and familiar controls; numeric readouts use tabular numbers. Maintain WCAG AA contrast.

Hierarchy: input/transport always available; presets and amplifier prominent; pedalboard secondary; practice, saved rigs and gear separate workspaces. Technical explanations in details elements. Never hide stop controls or imply a disabled feature works. Prefer consistent plain verbs and short labels.

Responsive: check 360/390/768/1440 px widths, no horizontal document overflow. Primary controls at least 44px; maintain native inputs for keyboard and touch. Visual dial and waveform decoration must not substitute for a usable native control. Color is supplementary to text state. Honor reduced motion, zoom and visible focus.

Quality review: render actual browser screenshots, inspect focus/contrast and accessibility reports, verify no console errors, and run core workflow tests. Changes should preserve audio safety and saved configuration compatibility.
