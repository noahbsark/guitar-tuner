const capoTool = document.getElementById("capoCalculator");
const shape = document.getElementById("capoShape");
const fret = document.getElementById("capoFret");
const song = document.getElementById("capoSong");
const mode = document.getElementById("capoMode");
const result = document.getElementById("capoResult");
const keyNames = ["C", "C♯ / D♭", "D", "D♯ / E♭", "E", "F", "F♯ / G♭", "G", "G♯ / A♭", "A", "A♯ / B♭", "B"];

function capoNote(start, offset) {
  return (start + offset + 12) % 12;
}

for (const field of [shape, song]) {
  keyNames.forEach((key, index) => field.add(new Option(key, String(index))));
}
for (let n = 0; n < 12; n++) fret.add(new Option(n === 0 ? "No capo" : `Fret ${n}`, String(n)));
shape.value = "0";
song.value = "2";
fret.value = "2";

function updateCapoResult() {
  const choice = mode.value;
  shape.closest(".tuning-control").hidden = choice === "shape";
  song.closest(".tuning-control").hidden = choice === "song";
  fret.closest(".tuning-control").hidden = choice === "fret";

  const shapeKey = Number(shape.value);
  const songKey = Number(song.value);
  const fretNumber = Number(fret.value);

  if (choice === "song") {
    result.textContent = `${keyNames[shapeKey]} shapes sound in ${keyNames[capoNote(shapeKey, fretNumber)]}.`;
  } else if (choice === "shape") {
    result.textContent = `To sound in ${keyNames[songKey]}, play ${keyNames[capoNote(songKey, -fretNumber)]} shapes.`;
  } else {
    const answer = capoNote(songKey, -shapeKey);
    result.textContent = answer === 0 ? "No capo is needed. The shapes and sounding key match."
      : `Capo fret ${answer} makes ${keyNames[shapeKey]} shapes sound in ${keyNames[songKey]}.`;
    if (answer >= 7) result.textContent += " If that fret is too high to play comfortably, choose different shapes.";
  }
}

capoTool.addEventListener("change", updateCapoResult);
updateCapoResult();
capoTool.hidden = false;
