/*
  Browser notes:
  - This tuner uses the microphone only to detect pitch in the browser.
  - Audio is not recorded, stored, or uploaded.
  - For reliable microphone access on phones, serve this site from HTTPS.
  - Opening from Files, iCloud Drive, Google Drive, Dropbox, or file:// may not trigger microphone permission on mobile browsers.
  - iOS Safari and many mobile browsers require the user to tap Start before audio can begin.
*/

const TUNINGS = {
  standard: {
    name: "Standard",
    label: "E A D G B E",
    strings: [
      { note: "E2", frequency: 82.4069 },
      { note: "A2", frequency: 110.0000 },
      { note: "D3", frequency: 146.8324 },
      { note: "G3", frequency: 195.9977 },
      { note: "B3", frequency: 246.9417 },
      { note: "E4", frequency: 329.6276 }
    ]
  },
  standard432: {
    name: "432 Hz Standard",
    label: "E A D G B E · A4 = 432 Hz",
    strings: [
      { note: "E2", frequency: 80.9086 },
      { note: "A2", frequency: 108.0000 },
      { note: "D3", frequency: 144.1627 },
      { note: "G3", frequency: 192.4341 },
      { note: "B3", frequency: 242.4518 },
      { note: "E4", frequency: 323.6343 }
    ]
  },
  standard528: {
    name: "528 Hz (A=444 Hz)",
    label: "E A D G B E · C5 = 528 Hz (A4 = 443.993 Hz)",
    strings: [
      { note: "E2", frequency: 83.1548 },
      { note: "A2", frequency: 110.9983 },
      { note: "D3", frequency: 148.1650 },
      { note: "G3", frequency: 197.7765 },
      { note: "B3", frequency: 249.1828 },
      { note: "E4", frequency: 332.6192 }
    ]
  },
  halfStepDown: {
    name: "Half Step Down",
    label: "Eb Ab Db Gb Bb Eb",
    strings: [
      { note: "Eb2", frequency: 77.7817 },
      { note: "Ab2", frequency: 103.8262 },
      { note: "Db3", frequency: 138.5913 },
      { note: "Gb3", frequency: 184.9972 },
      { note: "Bb3", frequency: 233.0819 },
      { note: "Eb4", frequency: 311.1270 }
    ]
  },
  wholeStepDown: {
    name: "Whole Step Down",
    label: "D G C F A D",
    strings: [
      { note: "D2", frequency: 73.4162 },
      { note: "G2", frequency: 97.9989 },
      { note: "C3", frequency: 130.8128 },
      { note: "F3", frequency: 174.6141 },
      { note: "A3", frequency: 220.0000 },
      { note: "D4", frequency: 293.6648 }
    ]
  },
  dropD: {
    name: "Drop D",
    label: "D A D G B E",
    strings: [
      { note: "D2", frequency: 73.4162 },
      { note: "A2", frequency: 110.0000 },
      { note: "D3", frequency: 146.8324 },
      { note: "G3", frequency: 195.9977 },
      { note: "B3", frequency: 246.9417 },
      { note: "E4", frequency: 329.6276 }
    ]
  },
  doubleDropD: {
    name: "Double Drop D",
    label: "D A D G B D",
    strings: [
      { note: "D2", frequency: 73.4162 },
      { note: "A2", frequency: 110.0000 },
      { note: "D3", frequency: 146.8324 },
      { note: "G3", frequency: 195.9977 },
      { note: "B3", frequency: 246.9417 },
      { note: "D4", frequency: 293.6648 }
    ]
  },
  dropC: {
    name: "Drop C",
    label: "C G C F A D",
    strings: [
      { note: "C2", frequency: 65.4064 },
      { note: "G2", frequency: 97.9989 },
      { note: "C3", frequency: 130.8128 },
      { note: "F3", frequency: 174.6141 },
      { note: "A3", frequency: 220.0000 },
      { note: "D4", frequency: 293.6648 }
    ]
  },
  openC: {
    name: "Open C",
    label: "C G C G C E",
    strings: [
      { note: "C2", frequency: 65.4064 },
      { note: "G2", frequency: 97.9989 },
      { note: "C3", frequency: 130.8128 },
      { note: "G3", frequency: 195.9977 },
      { note: "C4", frequency: 261.6256 },
      { note: "E4", frequency: 329.6276 }
    ]
  },
  dadgad: {
    name: "DADGAD",
    label: "D A D G A D",
    strings: [
      { note: "D2", frequency: 73.4162 },
      { note: "A2", frequency: 110.0000 },
      { note: "D3", frequency: 146.8324 },
      { note: "G3", frequency: 195.9977 },
      { note: "A3", frequency: 220.0000 },
      { note: "D4", frequency: 293.6648 }
    ]
  },
  openG: {
    name: "Open G",
    label: "D G D G B D",
    strings: [
      { note: "D2", frequency: 73.4162 },
      { note: "G2", frequency: 97.9989 },
      { note: "D3", frequency: 146.8324 },
      { note: "G3", frequency: 195.9977 },
      { note: "B3", frequency: 246.9417 },
      { note: "D4", frequency: 293.6648 }
    ]
  },
  openD: {
    name: "Open D",
    label: "D A D F# A D",
    strings: [
      { note: "D2", frequency: 73.4162 },
      { note: "A2", frequency: 110.0000 },
      { note: "D3", frequency: 146.8324 },
      { note: "F#3", frequency: 184.9972 },
      { note: "A3", frequency: 220.0000 },
      { note: "D4", frequency: 293.6648 }
    ]
  },
  openE: {
    name: "Open E",
    label: "E B E G# B E",
    strings: [
      { note: "E2", frequency: 82.4069 },
      { note: "B2", frequency: 123.4708 },
      { note: "E3", frequency: 164.8138 },
      { note: "G#3", frequency: 207.6523 },
      { note: "B3", frequency: 246.9417 },
      { note: "E4", frequency: 329.6276 }
    ]
  },
  openA: {
    name: "Open A",
    label: "E A E A C# E",
    strings: [
      { note: "E2", frequency: 82.4069 },
      { note: "A2", frequency: 110.0000 },
      { note: "E3", frequency: 164.8138 },
      { note: "A3", frequency: 220.0000 },
      { note: "C#4", frequency: 277.1826 },
      { note: "E4", frequency: 329.6276 }
    ]
  },
  openB: {
    name: "Open B",
    label: "B F# B F# B D#",
    strings: [
      { note: "B1", frequency: 61.7354 },
      { note: "F#2", frequency: 92.4986 },
      { note: "B2", frequency: 123.4708 },
      { note: "F#3", frequency: 184.9972 },
      { note: "B3", frequency: 246.9417 },
      { note: "D#4", frequency: 311.1270 }
    ]
  },
  openC6: {
    name: "Open C6",
    label: "C A C G C E",
    strings: [
      { note: "C2", frequency: 65.4064 },
      { note: "A2", frequency: 110.0000 },
      { note: "C3", frequency: 130.8128 },
      { note: "G3", frequency: 195.9977 },
      { note: "C4", frequency: 261.6256 },
      { note: "E4", frequency: 329.6276 }
    ]
  },
  dropB: {
    name: "Drop B",
    label: "B F# B E G# C#",
    strings: [
      { note: "B1", frequency: 61.7354 },
      { note: "F#2", frequency: 92.4986 },
      { note: "B2", frequency: 123.4708 },
      { note: "E3", frequency: 164.8138 },
      { note: "G#3", frequency: 207.6523 },
      { note: "C#4", frequency: 277.1826 }
    ]
  },
  dropA: {
    name: "Drop A",
    label: "A E A D F# B",
    strings: [
      { note: "A1", frequency: 55.0000 },
      { note: "E2", frequency: 82.4069 },
      { note: "A2", frequency: 110.0000 },
      { note: "D3", frequency: 146.8324 },
      { note: "F#3", frequency: 184.9972 },
      { note: "B3", frequency: 246.9417 }
    ]
  },
  cStandard: {
    name: "C Standard",
    label: "C F Bb Eb G C",
    strings: [
      { note: "C2", frequency: 65.4064 },
      { note: "F2", frequency: 87.3071 },
      { note: "Bb2", frequency: 116.5409 },
      { note: "Eb3", frequency: 155.5635 },
      { note: "G3", frequency: 195.9977 },
      { note: "C4", frequency: 261.6256 }
    ]
  },
  bStandard: {
    name: "B Standard",
    label: "B E A D F# B",
    strings: [
      { note: "B1", frequency: 61.7354 },
      { note: "E2", frequency: 82.4069 },
      { note: "A2", frequency: 110.0000 },
      { note: "D3", frequency: 146.8324 },
      { note: "F#3", frequency: 184.9972 },
      { note: "B3", frequency: 246.9417 }
    ]
  }
};

TUNINGS.sevenStandard = {
  name: "Seven-string Standard",
  label: "B E A D G B E",
  strings: [TUNINGS.bStandard.strings[0], ...TUNINGS.standard.strings]
};
TUNINGS.sevenDropA = {
  name: "Seven-string Drop A",
  label: "A E A D G B E",
  strings: [TUNINGS.dropA.strings[0], ...TUNINGS.standard.strings]
};

TUNINGS.chromatic = {name: "Chromatic", label: "A4 = 440 Hz", strings: []};

const TWELVE_STRING_DEFAULT = "twelveStandard";
TUNINGS[TWELVE_STRING_DEFAULT] = {
  name: "12-string Standard",
  label: "E A D G B E in six pairs",
  strings: TUNINGS.standard.strings.flatMap((main, index) => {
    const octave = index < 4;
    const course = 6 - index;
    const pair = octave
      ? {note: main.note[0] + (Number(main.note[1]) + 1), frequency: main.frequency * 2}
      : main;
    return [
      {...main, label: `Course ${course} ${octave ? "main" : "first"}: ${main.note}`},
      {...pair, label: `Course ${course} ${octave ? "octave" : "second"}: ${pair.note}`}
    ];
  })
};

TUNINGS.bass4 = {
  name: "4-string bass Standard",
  label: "E A D G",
  strings: TUNINGS.standard.strings.slice(0, 4).map(string => ({
    note: string.note[0] + (Number(string.note[1]) - 1),
    frequency: string.frequency / 2
  }))
};
TUNINGS.bass5 = {
  name: "5-string bass Standard",
  label: "B E A D G",
  strings: [{note: "B0", frequency: TUNINGS.sevenStandard.strings[0].frequency / 2}, ...TUNINGS.bass4.strings]
};
const MIN_BASS_FREQUENCY = 27;
const MAX_BASS_FREQUENCY = 210;
const CUSTOM_MIN_NOTE = 33;
const CUSTOM_MAX_NOTE = 76;
const STANDARD_MIDI = [40, 45, 50, 55, 59, 64];

const IN_TUNE_CENTS = 5;
const MAX_METER_CENTS = 50;
const MAX_TARGET_DISTANCE_CENTS = 225;
const MIN_DETECTABLE_FREQUENCY = 45;
const MAX_DETECTABLE_FREQUENCY = 390;
const MAX_CHROMATIC_FREQUENCY = 700;
const MIN_RMS = 0.012;
const MIN_CLARITY = 0.68;
const STABLE_FRAMES_REQUIRED = 3;

const tuningSelect = document.getElementById("tuningSelect");
const stringsContainer = document.getElementById("strings");
const toggleButton = document.getElementById("toggleButton");
const statusPill = document.getElementById("statusPill");
const statusText = document.getElementById("statusText");
const noteReadout = document.getElementById("noteReadout");
const helperText = document.getElementById("helperText");
const detailsText = document.getElementById("detailsText");
const needle = document.getElementById("needle");
const levelBar = document.getElementById("levelBar");

const query = new URLSearchParams(location.search);
const isCustomPage = document.body.dataset.tuning === "custom";
if (isCustomPage) {
  TUNINGS.custom = createCustomTuning(parseCustomNotes(query.get("notes")) || STANDARD_MIDI);
}

let currentTuningKey = document.body.dataset.tuning || query.get("tuning") || "standard";
if (!Object.hasOwn(TUNINGS, currentTuningKey) ||
    (tuningSelect && !Array.from(tuningSelect.options).some(option => option.value === currentTuningKey))) {
  currentTuningKey = tuningSelect?.options[0]?.value || "standard";
}
let currentStrings = TUNINGS[currentTuningKey].strings;
const isPairedTuning = () => currentTuningKey === TWELVE_STRING_DEFAULT;
const isBassTuning = () => currentTuningKey === "bass4" || currentTuningKey === "bass5";
const selectedPreset = document.getElementById("selectedPreset");

let audioContext = null;
let analyser = null;
let mediaStream = null;
let sourceNode = null;
let buffer = null;
let bassSamples = null;
let bassStride = 1;
let rafId = null;

let isListening = false;
let smoothedCents = 0;
let smoothedFrequency = null;
let manualTarget = null;
let stringSelect;
let playReference;
let referenceContext;
let referenceTone;
let microphoneHelp;
let inputControl;
let inputSelect;
let inputStatus;
let selectedInputId = "";
let stableFrameCount = 0;
let lastDetectedTarget = null;
let passProgress;
let resetPass;
const checkedNotes = new Set();
const openCapture = document.getElementById("captureOpenPitch");
const frettedCapture = document.getElementById("captureFrettedPitch");
let intonationOpen = null;
let intonationLive = null;

if (tuningSelect) {
  tuningSelect.value = currentTuningKey;
  tuningSelect.addEventListener("change", () => setCurrentTuning(tuningSelect.value));
}

function setCurrentTuning(key) {
  currentTuningKey = key;
  currentStrings = TUNINGS[key].strings;
  manualTarget = null;
  checkedNotes.clear();
  resetDetectionState();
  renderTuningChoices();
  helperText.textContent = isListening ? "Pluck a string" : "Tap Start and pluck a string";
  noteReadout.textContent = "—";
  noteReadout.className = "note note-idle";
  setNeedle(0, "idle");
}

toggleButton?.addEventListener("click", () => {
  if (isListening) stopListening();
  else startListening();
});

if (stringsContainer && currentTuningKey !== "chromatic") {
  const controls = document.createElement("div");
  controls.className = "tuning-control string-target-controls";
  const label = document.createElement("label");
  label.htmlFor = "stringSelect";
  label.textContent = "String target";
  stringSelect = document.createElement("select");
  stringSelect.id = "stringSelect";
  stringSelect.addEventListener("change", () => {
    manualTarget = stringSelect.value === "auto" ? null : currentStrings[Number(stringSelect.value)];
    handleUnstablePitch(0);
    if (!isListening) helperText.textContent = "Tap Start and pluck a string";
    playReference.disabled = !manualTarget || isListening;
  });
  playReference = document.createElement("button");
  playReference.type = "button";
  playReference.textContent = "Play reference tone";
  playReference.disabled = true;
  playReference.addEventListener("click", playTargetTone);
  const toneHelp = document.createElement("p");
  toneHelp.className = "reference-tone-help";
  toneHelp.textContent = "To tune by ear, leave the microphone off and choose a numbered string.";
  controls.append(label, stringSelect, toneHelp, playReference);
  stringsContainer.before(controls);
  const referenceShortcut = document.createElement("button");
  referenceShortcut.type = "button";
  referenceShortcut.className = "reference-shortcut";
  referenceShortcut.textContent = "Tune by ear";
  referenceShortcut.addEventListener("click", () => {
    if (isListening) stopListening();
    stringSelect.focus();
  });
  toggleButton.after(referenceShortcut);
  passProgress = document.createElement("span");
  passProgress.setAttribute("role", "status");
  resetPass = document.createElement("button");
  resetPass.type = "button";
  resetPass.textContent = "Reset tuning check";
  resetPass.addEventListener("click", () => {
    checkedNotes.clear();
    resetDetectionState();
    showWaiting(isListening ? "Pluck a string" : "Tap Start and pluck a string");
    updatePassProgress();
  });
  const pass = document.createElement("div");
  pass.className = "tuning-pass";
  pass.append(passProgress, resetPass);
  stringsContainer.after(pass);
}
if (toggleButton) {
  microphoneHelp = document.createElement("a");
  microphoneHelp.href = "/microphone-not-working-online-guitar-tuner";
  microphoneHelp.textContent = "Fix microphone access";
  microphoneHelp.hidden = true;
  toggleButton.after(microphoneHelp);
  inputControl = document.createElement("div");
  inputControl.className = "tuning-control";
  inputControl.hidden = true;
  const label = document.createElement("label");
  label.textContent = "Microphone input";
  label.htmlFor = "microphoneInput";
  inputSelect = document.createElement("select");
  inputSelect.id = "microphoneInput";
  inputSelect.addEventListener("change", () => {
    selectedInputId = inputSelect.value;
    if (isListening) stopListening();
    inputStatus.textContent = "Press Start listening to use this input.";
  });
  inputStatus = document.createElement("p");
  inputStatus.setAttribute("role", "status");
  inputStatus.className = "reference-tone-help";
  inputControl.append(label, inputSelect, inputStatus);
  microphoneHelp.after(inputControl);
}
renderTuningChoices();
setNeedle(0, "idle");
renderFrequencyLookup();
renderTensionComparison();
renderRetuningPlanner();
renderCustomEditor();
initializeIntonationCheck();

function renderFrequencyLookup() {
  const lookup = document.getElementById("frequencyLookup");
  if (!lookup) return;

  const select = document.getElementById("frequencyPreset");
  const targets = document.getElementById("frequencyTargets");
  for (const [key, tuning] of Object.entries(TUNINGS)) {
    if (key !== "custom" && tuning.strings.length) select.add(new Option(tuning.name, key));
  }
  function renderTargets() {
    const {strings} = TUNINGS[select.value];
    targets.replaceChildren();
    strings.forEach((string, index) => {
      const row = targets.insertRow();
      row.insertCell().textContent = string.label?.split(":")[0] || strings.length - index;
      row.insertCell().textContent = string.note;
      row.insertCell().textContent = `${string.frequency.toFixed(2)} Hz`;
    });
  }
  select.addEventListener("change", renderTargets);
  renderTargets();
  lookup.hidden = false;
}

function renderTensionComparison() {
  const comparison = document.getElementById("tensionComparison");
  if (!comparison) return;

  const from = document.getElementById("tensionFrom");
  const to = document.getElementById("tensionTo");
  const targets = document.getElementById("tensionTargets");
  populateSixStringPresets(from, to);
  from.value = "standard";
  to.value = "dropD";

  function renderComparison() {
    const source = TUNINGS[from.value].strings;
    targets.replaceChildren();
    TUNINGS[to.value].strings.forEach((target, index) => {
      const start = source[index];
      const percent = Math.round(relativeTensionChange(start.frequency, target.frequency));
      const row = targets.insertRow();
      const number = document.createElement("th");
      number.scope = "row";
      number.textContent = 6 - index;
      row.appendChild(number);
      row.insertCell().textContent = start.note;
      row.insertCell().textContent = target.note;
      row.insertCell().textContent = percent === 0 ? "Unchanged" : `${percent > 0 ? "+" : "−"}${Math.abs(percent)}%`;
    });
  }

  from.addEventListener("change", renderComparison);
  to.addEventListener("change", renderComparison);
  renderComparison();
  comparison.hidden = false;
}

function renderRetuningPlanner() {
  const planner = document.getElementById("retuningPlanner");
  if (!planner) return;

  const from = document.getElementById("retuneFrom");
  const to = document.getElementById("retuneTo");
  const rows = document.getElementById("retuneTargets");
  const meterLink = document.getElementById("retuneMeter");
  const summary = document.getElementById("retuneSummary");
  populateSixStringPresets(from, to);
  from.value = "standard";
  to.value = "dadgad";

  function renderPlan() {
    const source = TUNINGS[from.value];
    const destination = TUNINGS[to.value];
    rows.replaceChildren();
    let changes = 0;
    destination.strings.forEach((target, index) => {
      const start = source.strings[index];
      const movement = describeRetuning(start.frequency, target.frequency);
      const row = rows.insertRow();
      const number = document.createElement("th");
      number.scope = "row";
      number.textContent = 6 - index;
      row.appendChild(number);
      row.insertCell().textContent = start.note;
      row.insertCell().textContent = target.note + " · " + target.frequency.toFixed(2) + " Hz";
      row.insertCell().textContent = movement;
      if (movement !== "Leave as is") changes++;
    });
    summary.textContent = changes === 0 ? "No strings need to change."
      : `${changes} of 6 strings change from ${source.name} to ${destination.name}.`;
    meterLink.href = "/?tuning=" + encodeURIComponent(to.value);
  }
  from.addEventListener("change", renderPlan);
  to.addEventListener("change", renderPlan);
  renderPlan();
  planner.hidden = false;
}

function describeRetuning(fromFrequency, toFrequency) {
  const cents = Math.round(frequencyToCents(toFrequency, fromFrequency));
  if (cents === 0) return "Leave as is";
  const change = Math.abs(cents);
  const direction = cents > 0 ? "Raise" : "Lower";
  if (change % 100 !== 0) return `${direction} ${change} cents`;
  const semitones = change / 100;
  return `${direction} ${semitones} semitone${semitones === 1 ? "" : "s"}`;
}

function populateSixStringPresets(from, to) {
  for (const [key, tuning] of Object.entries(TUNINGS)) {
    if (key === "custom" || tuning.strings.length !== 6) continue;
    from.add(new Option(tuning.name, key));
    to.add(new Option(tuning.name, key));
  }
}

function relativeTensionChange(fromFrequency, toFrequency) {
  return ((toFrequency / fromFrequency) ** 2 - 1) * 100;
}

function microphoneConstraints(inputId) {
  const audio = {echoCancellation: false, noiseSuppression: false, autoGainControl: false};
  if (inputId) audio.deviceId = {exact: inputId};
  return {audio};
}

async function showMicrophoneInputs(stream, track) {
  if (!inputSelect || !navigator.mediaDevices.enumerateDevices) return;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    if (mediaStream !== stream || !isListening) return;
    const inputs = devices.filter(device => device.kind === "audioinput" && device.deviceId &&
      device.deviceId !== "default" && device.deviceId !== "communications");
    inputSelect.replaceChildren(new Option("System default", ""));
    inputs.forEach((device, index) => {
      inputSelect.add(new Option(device.label || `Microphone ${index + 1}`, device.deviceId));
    });
    if (!inputs.some(device => device.deviceId === selectedInputId)) selectedInputId = "";
    inputSelect.value = selectedInputId;
    inputControl.hidden = inputs.length === 0;
    inputStatus.textContent = track?.label ? `Using ${track.label}.` : "Using the selected audio input.";
  } catch {
    // Device listing is optional. An active microphone can still tune.
  }
}

async function startListening() {
  toggleButton.disabled = true;
  if (inputSelect) inputSelect.disabled = true;
  const referenceShortcut = document.querySelector(".reference-shortcut");
  if (referenceShortcut) referenceShortcut.disabled = true;
  if (playReference) playReference.disabled = true;
  if (referenceTone) referenceTone.stop();
  if (microphoneHelp) microphoneHelp.hidden = true;
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("getUserMedia is not supported in this browser.");
    }

    setStatus("Requesting microphone…", "idle");
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    mediaStream = await navigator.mediaDevices.getUserMedia(microphoneConstraints(selectedInputId));

    sourceNode = audioContext.createMediaStreamSource(mediaStream);
    analyser = audioContext.createAnalyser();
    bassStride = isBassTuning() ? clamp(2 ** Math.ceil(Math.log2(audioContext.sampleRate / 24000)), 2, 8) : 1;
    analyser.fftSize = 4096 * bassStride;
    bassSamples = isBassTuning() ? new Float32Array(4096) : null;
    analyser.smoothingTimeConstant = 0;

    buffer = new Float32Array(analyser.fftSize);
    sourceNode.connect(analyser);

    isListening = true;
    const stream = mediaStream;
    const track = stream.getAudioTracks()[0];
    track?.addEventListener("ended", () => {
      if (!isListening || stream !== mediaStream) return;
      stopListening();
      setStatus("Microphone disconnected", "error");
      helperText.textContent = "Reconnect the input or choose System default, then press Start listening.";
      if (microphoneHelp) microphoneHelp.hidden = false;
    });
    void showMicrophoneInputs(stream, track);
    toggleButton.textContent = "Stop listening";
    toggleButton.classList.add("stop");
    toggleButton.setAttribute("aria-pressed", "true");
    setStatus("Listening", "listening");
    helperText.textContent = "Pluck a string";
    detailsText.textContent = `${TUNINGS[currentTuningKey].name}: ${TUNINGS[currentTuningKey].label}`;
    updateLoop();
  } catch (error) {
    console.error(error);
    stopListening();

    let message = "Could not access microphone.";
    if (error && error.name === "NotAllowedError") message = "Microphone permission was denied.";
    else if (selectedInputId && (error?.name === "NotFoundError" || error?.name === "OverconstrainedError")) {
      selectedInputId = "";
      inputSelect.value = "";
      message = "That input is unavailable. Press Start listening to try the system default.";
    } else if (error?.name === "NotFoundError") message = "No microphone was found.";
    else if (!window.isSecureContext) message = "Microphone access needs HTTPS on most phones.";

    setStatus("Microphone error", "error");
    noteReadout.textContent = "!";
    noteReadout.className = "note note-idle";
    helperText.textContent = message;
    detailsText.textContent = "Open the HTTPS website and check browser permissions.";
    if (microphoneHelp) microphoneHelp.hidden = false;
  } finally {
    toggleButton.disabled = false;
    if (inputSelect) inputSelect.disabled = false;
    if (referenceShortcut) referenceShortcut.disabled = false;
  }
}

function stopListening() {
  isListening = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;

  if (sourceNode) {
    try { sourceNode.disconnect(); } catch (_) {}
    sourceNode = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  analyser = null;
  buffer = null;
  bassSamples = null;
  resetDetectionState();

  if (toggleButton) {
    toggleButton.textContent = "Start listening";
    toggleButton.classList.remove("stop");
    toggleButton.setAttribute("aria-pressed", "false");
  }

  if (playReference) playReference.disabled = !manualTarget;
  if (inputStatus) inputStatus.textContent = "";
  setStatus("Microphone off", "idle");
  noteReadout.textContent = "—";
  noteReadout.className = "note note-idle";
  helperText.textContent = "Tap Start and pluck a string";
  detailsText.textContent = `${TUNINGS[currentTuningKey].name}: ${TUNINGS[currentTuningKey].label}`;
  levelBar.style.width = "0%";
  setNeedle(0, "idle");
  updateStringHighlight(null, "idle");
}

function resetDetectionState() {
  setIntonationPitch(null);
  smoothedFrequency = null;
  smoothedCents = 0;
  stableFrameCount = 0;
  lastDetectedTarget = null;
}

function updateLoop() {
  if (!isListening || !analyser || !buffer) return;

  analyser.getFloatTimeDomainData(buffer);
  const rms = getRMS(buffer);
  levelBar.style.width = `${Math.min(100, rms * 520)}%`;

  const chromatic = currentTuningKey === "chromatic";
  if ((isPairedTuning() || isCustomPage) && !manualTarget) {
    showWaiting(isPairedTuning() ? "Choose a course member to tune" : "Choose a string target to tune");
    rafId = requestAnimationFrame(updateLoop);
    return;
  }
  const minimum = isBassTuning() ? MIN_BASS_FREQUENCY : MIN_DETECTABLE_FREQUENCY;
  const frequencyLimit = isBassTuning() ? MAX_BASS_FREQUENCY
    : chromatic || isPairedTuning() || isCustomPage ? MAX_CHROMATIC_FREQUENCY : MAX_DETECTABLE_FREQUENCY;
  let samples = buffer;
  let sampleRate = audioContext.sampleRate;
  if (bassSamples) {
    averageSamples(buffer, bassSamples, bassStride);
    samples = bassSamples;
    sampleRate /= bassStride;
  }
  const result = detectPitchAutocorrelation(samples, sampleRate, rms, frequencyLimit, minimum);

  if (!result || result.frequency < minimum || result.frequency > frequencyLimit || result.clarity < MIN_CLARITY) {
    handleUnstablePitch(rms);
    rafId = requestAnimationFrame(updateLoop);
    return;
  }

  const nearest = chromatic ? getChromaticTarget(result.frequency) : manualTarget || getNearestString(result.frequency);
  const cents = frequencyToCents(result.frequency, nearest.frequency);

  if (!manualTarget && Math.abs(cents) > MAX_TARGET_DISTANCE_CENTS) {
    resetDetectionState();
    showWaiting("Pitch outside this preset. Choose a string target or check the preset.");
    rafId = requestAnimationFrame(updateLoop);
    return;
  }

  if (lastDetectedTarget !== nearest.note ||
      (smoothedFrequency !== null && Math.abs(frequencyToCents(result.frequency, smoothedFrequency)) > 100)) {
    resetDetectionState();
    showWaiting("Waiting for a steady pitch");
    lastDetectedTarget = nearest.note;
  }
  stableFrameCount += 1;

  const firstFrame = smoothedFrequency === null;
  smoothedFrequency = firstFrame ? result.frequency : smoothedFrequency * 0.72 + result.frequency * 0.28;
  smoothedCents = firstFrame ? cents : smoothedCents * 0.72 + cents * 0.28;

  if (stableFrameCount >= STABLE_FRAMES_REQUIRED) renderTuning(nearest, smoothedFrequency, smoothedCents);
  rafId = requestAnimationFrame(updateLoop);
}

function handleUnstablePitch(rms) {
  resetDetectionState();
  showWaiting(rms < MIN_RMS ? "Pluck a string" : "Let one string ring clearly");
}

function showWaiting(message) {
  helperText.textContent = message;
  detailsText.textContent = manualTarget ? `Target: ${manualTarget.label || manualTarget.note}` : "No stable pitch detected";
  noteReadout.textContent = "—";
  noteReadout.className = "note note-idle";
  setNeedle(0, "idle");
  updateStringHighlight(manualTarget, "idle");
}

function renderTuning(target, frequency, cents) {
  setIntonationPitch(frequency);
  const absCents = Math.abs(cents);
  let state;
  let helper;

  if (absCents > MAX_TARGET_DISTANCE_CENTS) {
    state = "idle";
    helper = "Far from target. Check the string and octave.";
  } else if (absCents <= IN_TUNE_CENTS) {
    state = "in-tune";
    helper = "In tune";
  } else if (cents < 0) {
    state = "flat";
    helper = cents < -20 ? "Too flat — tune up" : "Slightly flat";
  } else {
    state = "sharp";
    helper = cents > 20 ? "Too sharp — tune down" : "Slightly sharp";
  }

  noteReadout.textContent = target.note;
  noteReadout.className = `note ${state}`;
  helperText.textContent = helper;
  const referenceA = currentTuningKey === "standard432" ? 432
    : currentTuningKey === "standard528" ? 528 / 2 ** (3 / 12) : 440;
  const detectedNote = getChromaticTarget(frequency, referenceA).note;
  detailsText.textContent = currentTuningKey === "chromatic"
    ? `${frequency.toFixed(1)} Hz · ${formatSigned(cents)} cents relative to ${target.note}`
    : `Target: ${target.label || target.note} · Detected: ${detectedNote} (${frequency.toFixed(1)} Hz) · ${formatSigned(cents)} cents`;
  if (passProgress && state === "in-tune" && !checkedNotes.has(target)) {
    checkedNotes.add(target);
    updatePassProgress();
  }
  setNeedle(state === "idle" ? 0 : cents, state);
  updateStringHighlight(target, state);
}

function getChromaticTarget(frequency, referenceA = 440) {
  return noteAtMidi(Math.round(69 + 12 * Math.log2(frequency / referenceA)), referenceA);
}

function noteAtMidi(midi, referenceA = 440) {
  const names = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
  return {
    note: names[midi % 12] + (Math.floor(midi / 12) - 1),
    frequency: referenceA * 2 ** ((midi - 69) / 12)
  };
}

function parseCustomNotes(value) {
  if (!value || !/^\d{2}(,\d{2}){5}$/.test(value)) return null;
  const notes = value.split(",").map(Number);
  return notes.every(note => note >= CUSTOM_MIN_NOTE && note <= CUSTOM_MAX_NOTE) ? notes : null;
}

function createCustomTuning(notes) {
  const strings = notes.map(midi => ({...noteAtMidi(midi), midi}));
  return {name: "Custom tuning", label: strings.map(string => string.note).join(" "), strings};
}

function renderCustomEditor() {
  if (!isCustomPage) return;
  const editor = document.getElementById("customEditor");
  const selects = [...editor.querySelectorAll("select")];
  const output = document.getElementById("customShare");
  const status = document.getElementById("customShareStatus");
  const copy = document.getElementById("copyCustomLink");
  const warning = document.getElementById("customHigher");
  if (query.has("notes") && !parseCustomNotes(query.get("notes"))) {
    status.textContent = "This link has invalid notes. Showing Standard as a starting point.";
  }

  selects.forEach((select, index) => {
    for (let midi = CUSTOM_MIN_NOTE; midi <= CUSTOM_MAX_NOTE; midi++) {
      select.add(new Option(noteAtMidi(midi).note, String(midi)));
    }
    select.value = TUNINGS.custom.strings[index].midi;
    select.addEventListener("change", () => {
      const notes = selects.map(field => Number(field.value));
      TUNINGS.custom = createCustomTuning(notes);
      setCurrentTuning("custom");
      status.textContent = "";
      updateShareLink(notes);
    });
  });

  function updateShareLink(notes) {
    const url = new URL("/custom-guitar-tuner", location.origin);
    url.searchParams.set("notes", notes.join(","));
    output.value = url.href;
    warning.hidden = !notes.some((note, index) => note > STANDARD_MIDI[index]);
    copy.textContent = "Copy tuning link";
  }

  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      status.textContent = "Tuning link copied.";
    } catch {
      output.focus();
      output.select();
      status.textContent = "Tuning link selected. Copy it using your device.";
    }
  });

  updateShareLink(TUNINGS.custom.strings.map(string => string.midi));
  editor.hidden = false;
}

function initializeIntonationCheck() {
  if (!openCapture) return;
  const openReading = document.getElementById("intonationOpen");
  const frettedReading = document.getElementById("intonationFretted");
  const result = document.getElementById("intonationResult");

  openCapture.addEventListener("click", () => {
    if (intonationLive === null) return;
    intonationOpen = intonationLive;
    openReading.textContent = formatIntonationReading(intonationOpen);
    frettedReading.textContent = "—";
    result.textContent = "Open pitch recorded. Fret the same string at the 12th fret.";
    setIntonationPitch(null);
  });

  frettedCapture.addEventListener("click", () => {
    if (intonationLive === null || intonationOpen === null) return;
    const cents = intonationDifferenceCents(intonationOpen, intonationLive);
    if (cents === null) {
      frettedReading.textContent = "—";
      result.textContent = "That reading is outside the expected octave. Fret the same string at the 12th fret and try again.";
      return;
    }
    frettedReading.textContent = formatIntonationReading(intonationLive);
    const rounded = Math.round(Math.abs(cents));
    result.textContent = rounded === 0 ? "The fretted note is within one cent of the expected octave."
      : `The fretted note is about ${rounded} ${rounded === 1 ? "cent" : "cents"} ${cents > 0 ? "sharp" : "flat"} against the measured open string. Repeat the check before making an adjustment.`;
  });
  document.getElementById("clearIntonation").addEventListener("click", () => {
    intonationOpen = null;
    openReading.textContent = "—";
    frettedReading.textContent = "—";
    result.textContent = "Start with an open string.";
    setIntonationPitch(null);
  });
}

function formatIntonationReading(frequency) {
  return `${getChromaticTarget(frequency).note} · ${frequency.toFixed(2)} Hz`;
}

function intonationDifferenceCents(open, fretted) {
  const cents = frequencyToCents(fretted, open * 2);
  return Math.abs(cents) <= 100 ? cents : null;
}

function setIntonationPitch(frequency) {
  if (!openCapture) return;
  intonationLive = frequency;
  openCapture.disabled = frequency === null;
  frettedCapture.disabled = frequency === null || intonationOpen === null;
}

function updatePassProgress() {
  if (!passProgress) return;
  const count = checkedNotes.size;
  const description = isPairedTuning() || isCustomPage ? "selected targets heard in tune" : "target pitches heard in tune";
  passProgress.textContent = `${count}/${currentStrings.length} ${description}`;
  resetPass.disabled = count === 0;
  stringsContainer.querySelectorAll(".string").forEach(string => {
    const checked = checkedNotes.has(currentStrings[Number(string.dataset.index)]);
    string.classList.toggle("was-in-tune", checked);
    string.setAttribute("aria-label", string.dataset.label + (checked ? ", heard in tune" : ""));
  });
}

function renderTuningChoices() {
  if (!stringsContainer) return;
  const tuning = TUNINGS[currentTuningKey];
  if (!tuning.strings.length) return;
  if (selectedPreset) selectedPreset.textContent = `Selected preset: ${tuning.name} · ${tuning.label}`;
  stringsContainer.style.setProperty("--string-count", Math.min(tuning.strings.length, 7));
  stringsContainer.replaceChildren();
  if (stringSelect) {
    stringSelect.replaceChildren(new Option(isPairedTuning() ? "Choose a course member" : isCustomPage ? "Choose a string" : "Automatic", "auto"));
    tuning.strings.forEach((string, index) => {
      stringSelect.add(new Option(string.label || `${tuning.strings.length - index}: ${string.note}`, String(index)));
    });
    playReference.disabled = true;
  }
  tuning.strings.forEach((string, index) => {
    const el = document.createElement("div");
    el.className = "string";
    el.dataset.index = index;
    el.dataset.label = string.label || string.note;
    el.textContent = string.note;
    stringsContainer.appendChild(el);
  });
  updatePassProgress();
  if (detailsText) detailsText.textContent = `${tuning.name}: ${tuning.label}`;
}

async function playTargetTone() {
  const target = manualTarget;
  try {
    referenceContext ||= new (window.AudioContext || window.webkitAudioContext)();
    await referenceContext.resume();
    if (isListening || toggleButton.disabled || target !== manualTarget) return;
    if (referenceTone) referenceTone.stop();
    const tone = referenceContext.createOscillator();
    const gain = referenceContext.createGain();
    const now = referenceContext.currentTime;
    tone.type = "triangle";
    tone.frequency.value = target.frequency;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
    tone.connect(gain).connect(referenceContext.destination);
    referenceTone = tone;
    tone.onended = () => {
      tone.disconnect();
      gain.disconnect();
      if (referenceTone === tone) referenceTone = null;
    };
    tone.start(now);
    tone.stop(now + 1.3);
  } catch {
    helperText.textContent = "Reference playback is unavailable in this browser.";
  }
}

function setStatus(text, mode) {
  if (!statusText || !statusPill) return;
  statusText.textContent = text;
  statusPill.classList.toggle("listening", mode === "listening");
  statusPill.classList.toggle("error", mode === "error");
}

function setNeedle(cents, state) {
  if (!needle) return;
  const clamped = clamp(cents, -MAX_METER_CENTS, MAX_METER_CENTS);
  const percent = 50 + (clamped / MAX_METER_CENTS) * 50;
  needle.style.left = `${percent}%`;
  needle.style.opacity = state === "idle" ? "0.45" : "1";

  if (state === "in-tune") needle.style.background = "var(--green)";
  else if (state === "flat") needle.style.background = "var(--blue)";
  else if (state === "sharp") needle.style.background = "var(--yellow)";
  else needle.style.background = "var(--red)";
}

function updateStringHighlight(target, state) {
  document.querySelectorAll(".string").forEach(el => {
    const active = currentStrings[Number(el.dataset.index)] === target;
    el.classList.toggle("active", active);
    el.classList.toggle("in-tune", active && state === "in-tune");
  });
}

function getNearestString(frequency) {
  let nearest = currentStrings[0];
  let smallestDistance = Infinity;
  for (const string of currentStrings) {
    const distance = Math.abs(1200 * Math.log2(frequency / string.frequency));
    if (distance < smallestDistance) {
      smallestDistance = distance;
      nearest = string;
    }
  }
  return nearest;
}

function frequencyToCents(frequency, targetFrequency) {
  return 1200 * Math.log2(frequency / targetFrequency);
}

function formatSigned(value) {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

function getRMS(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

function averageSamples(input, output, stride) {
  for (let i = 0; i < output.length; i++) {
    let sum = 0;
    for (let j = 0; j < stride; j++) sum += input[i * stride + j];
    output[i] = sum / stride;
  }
}

function detectPitchAutocorrelation(samples, sampleRate, rms,
    maxFrequency = MAX_DETECTABLE_FREQUENCY, minFrequency = MIN_DETECTABLE_FREQUENCY) {
  if (rms < MIN_RMS) return null;

  const size = samples.length;
  const minLag = Math.floor(sampleRate / maxFrequency);
  const maxLag = Math.min(size - 1, Math.floor(sampleRate / minFrequency));
  if (maxLag <= minLag) return null;

  let bestLag = -1;
  let bestCorrelation = 0;
  const correlations = new Float32Array(maxLag + 1);

  // The two energy windows lose one sample apiece at each lag.
  // Only the cross-product needs to be recomputed over the full overlap.
  let sumA = 0;
  let sumB = 0;
  const firstOverlap = size - minLag;
  for (let i = 0; i < firstOverlap; i++) {
    sumA += samples[i] ** 2;
    sumB += samples[i + minLag] ** 2;
  }

  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    const overlap = size - lag;
    for (let i = 0; i < overlap; i++) {
      sum += samples[i] * samples[i + lag];
    }

    const correlation = sumA > 0 && sumB > 0 ? sum / Math.sqrt(sumA * sumB) : 0;
    sumA -= samples[overlap - 1] ** 2;
    sumB -= samples[lag] ** 2;
    correlations[lag] = correlation;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  if (bestLag === -1 || bestCorrelation < MIN_CLARITY) return null;

  // A periodic signal also correlates at two, three, or more times its true
  // period. Prefer the earliest strong local peak so a clean A2 does not get
  // mistaken for the A1 subharmonic when low tunings are enabled.
  const peakThreshold = Math.max(MIN_CLARITY, bestCorrelation * 0.9);
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    const previous = correlations[lag - 1];
    const current = correlations[lag];
    const next = correlations[lag + 1];
    if (current >= peakThreshold && current >= previous && current > next) {
      bestLag = lag;
      bestCorrelation = current;
      break;
    }
  }

  let refinedLag = bestLag;
  if (bestLag > minLag && bestLag < maxLag) {
    const prev = correlations[bestLag - 1];
    const curr = correlations[bestLag];
    const next = correlations[bestLag + 1];
    const denominator = prev - 2 * curr + next;
    if (Math.abs(denominator) > 0.00001) {
      refinedLag = bestLag + 0.5 * (prev - next) / denominator;
    }
  }

  return {
    frequency: sampleRate / refinedLag,
    clarity: bestCorrelation
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
