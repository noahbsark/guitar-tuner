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

const IN_TUNE_CENTS = 5;
const MAX_METER_CENTS = 50;
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

let currentTuningKey = document.body.dataset.tuning || new URLSearchParams(location.search).get("tuning") || "standard";
if (!TUNINGS[currentTuningKey]) currentTuningKey = "standard";
let currentStrings = TUNINGS[currentTuningKey].strings;

let audioContext = null;
let analyser = null;
let mediaStream = null;
let sourceNode = null;
let buffer = null;
let rafId = null;

let isListening = false;
let smoothedCents = 0;
let smoothedFrequency = null;
let lastStableNote = null;
let stableFrameCount = 0;
let lastDetectedNote = null;

if (tuningSelect) {
  tuningSelect.value = currentTuningKey;
  tuningSelect.addEventListener("change", () => {
    currentTuningKey = tuningSelect.value;
    currentStrings = TUNINGS[currentTuningKey].strings;
    resetDetectionState();
    renderTuningChoices();
    helperText.textContent = isListening ? "Pluck a string" : "Tap Start and pluck a string";
    detailsText.textContent = `${TUNINGS[currentTuningKey].name}: ${TUNINGS[currentTuningKey].label}`;
    noteReadout.textContent = "—";
    noteReadout.className = "note note-idle";
    setNeedle(0, "idle");
  });
}

toggleButton?.addEventListener("click", () => {
  if (isListening) stopListening();
  else startListening();
});

renderTuningChoices();
setNeedle(0, "idle");

async function startListening() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("getUserMedia is not supported in this browser.");
    }

    setStatus("Requesting microphone…", "idle");
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    sourceNode = audioContext.createMediaStreamSource(mediaStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0;

    buffer = new Float32Array(analyser.fftSize);
    sourceNode.connect(analyser);

    isListening = true;
    toggleButton.textContent = "Stop listening";
    toggleButton.classList.add("stop");
    setStatus("Listening", "listening");
    helperText.textContent = "Pluck a string";
    detailsText.textContent = `${TUNINGS[currentTuningKey].name}: ${TUNINGS[currentTuningKey].label}`;
    updateLoop();
  } catch (error) {
    console.error(error);
    stopListening();

    let message = "Could not access microphone.";
    if (error && error.name === "NotAllowedError") message = "Microphone permission was denied.";
    else if (error && error.name === "NotFoundError") message = "No microphone was found.";
    else if (!window.isSecureContext) message = "Microphone access needs HTTPS on most phones.";

    setStatus("Microphone error", "error");
    noteReadout.textContent = "!";
    noteReadout.className = "note note-idle";
    helperText.textContent = message;
    detailsText.textContent = "Open the HTTPS website and check browser permissions.";
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
  resetDetectionState();

  if (toggleButton) {
    toggleButton.textContent = "Start listening";
    toggleButton.classList.remove("stop");
  }

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
  smoothedFrequency = null;
  smoothedCents = 0;
  stableFrameCount = 0;
  lastDetectedNote = null;
  lastStableNote = null;
}

function updateLoop() {
  if (!isListening || !analyser || !buffer) return;

  analyser.getFloatTimeDomainData(buffer);
  const rms = getRMS(buffer);
  levelBar.style.width = `${Math.min(100, rms * 520)}%`;

  const result = detectPitchAutocorrelation(buffer, audioContext.sampleRate, rms);

  if (!result || result.frequency < 65 || result.frequency > 390 || result.clarity < MIN_CLARITY) {
    handleUnstablePitch(rms);
    rafId = requestAnimationFrame(updateLoop);
    return;
  }

  const nearest = getNearestString(result.frequency);
  const cents = frequencyToCents(result.frequency, nearest.frequency);

  if (Math.abs(cents) > 85) {
    handleUnstablePitch(rms);
    rafId = requestAnimationFrame(updateLoop);
    return;
  }

  if (lastDetectedNote === nearest.note) stableFrameCount += 1;
  else {
    stableFrameCount = 1;
    lastDetectedNote = nearest.note;
  }

  if (stableFrameCount >= STABLE_FRAMES_REQUIRED) lastStableNote = nearest.note;

  smoothedFrequency = smoothedFrequency === null
    ? result.frequency
    : smoothedFrequency * 0.72 + result.frequency * 0.28;

  smoothedCents = smoothedCents * 0.72 + cents * 0.28;

  if (lastStableNote) renderTuning(nearest, smoothedFrequency, smoothedCents);
  rafId = requestAnimationFrame(updateLoop);
}

function handleUnstablePitch(rms) {
  stableFrameCount = 0;
  if (rms < MIN_RMS) {
    helperText.textContent = "Pluck a string";
    detailsText.textContent = "No stable pitch detected";
  } else {
    helperText.textContent = "Let one string ring clearly";
    detailsText.textContent = "Listening for a steady note";
  }
  noteReadout.textContent = lastStableNote || "—";
  noteReadout.className = "note note-idle";
  setNeedle(smoothedCents * 0.9, "idle");
  updateStringHighlight(lastStableNote, "idle");
}

function renderTuning(target, frequency, cents) {
  const absCents = Math.abs(cents);
  let state;
  let helper;

  if (absCents <= IN_TUNE_CENTS) {
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
  detailsText.textContent = `${formatSigned(cents)} cents · ${frequency.toFixed(1)} Hz`;
  setNeedle(cents, state);
  updateStringHighlight(target.note, state);
}

function renderTuningChoices() {
  if (!stringsContainer) return;
  const tuning = TUNINGS[currentTuningKey];
  stringsContainer.innerHTML = "";
  tuning.strings.forEach(string => {
    const el = document.createElement("div");
    el.className = "string";
    el.dataset.note = string.note;
    el.textContent = string.note;
    stringsContainer.appendChild(el);
  });
  if (detailsText) detailsText.textContent = `${tuning.name}: ${tuning.label}`;
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

function updateStringHighlight(note, state) {
  document.querySelectorAll(".string").forEach(el => {
    const active = el.dataset.note === note;
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

function detectPitchAutocorrelation(samples, sampleRate, rms) {
  if (rms < MIN_RMS) return null;

  const size = samples.length;
  const minFrequency = 65;
  const maxFrequency = 390;
  const minLag = Math.floor(sampleRate / maxFrequency);
  const maxLag = Math.floor(sampleRate / minFrequency);

  let bestLag = -1;
  let bestCorrelation = 0;
  const correlations = new Float32Array(maxLag + 1);

  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    let sumA = 0;
    let sumB = 0;

    for (let i = 0; i < size - lag; i++) {
      const a = samples[i];
      const b = samples[i + lag];
      sum += a * b;
      sumA += a * a;
      sumB += b * b;
    }

    const correlation = sum / Math.sqrt(sumA * sumB || 1);
    correlations[lag] = correlation;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  if (bestLag === -1 || bestCorrelation < MIN_CLARITY) return null;

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
