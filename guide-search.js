const guideSearch = document.getElementById("guideSearch");
const guideResults = document.getElementById("guideResults");
const guideSections = [...document.querySelectorAll(".guide-group")];

const searchAliases = {
  "/bass-string-scale-length-guide": "bass strings short scale long scale winding length ball end to taper through body restring fit",
  "/bass-guitar-tuner": "four five string low b bass",
  "/microphone-not-working-online-guitar-tuner": "mic permission denied tuner cannot hear can't hear no sound no input",
  "/guitar-fret-buzz-guide": "fret buzz buzzing guitar string rattles rattle open fretted in tune low action capo",
  "/guitar-tuning-troubleshooter": "buzz buzzing unstable sounds wrong after tuning diagnosis",
  "/why-guitar-strings-break": "broken guitar string snapped snapping keeps breaking saddle bridge post breakage replace broken high e",
  "/guitar-tuner-shows-wrong-note": "wrong octave tuner misreads wrong pitch",
  "/why-does-my-guitar-keep-going-out-of-tune": "won't wont stay in tune loses pitch drifting keeps slipping",
  "/why-guitar-tuner-jumps-between-notes": "jittery bouncing unstable needle display",
  "/guitar-nut-tuning-problems": "nut binds ping pings clicking when turning peg",
  "/guitar-tuning-peg-troubleshooting": "tuning key machine head not turning loose slipping",
  "/guitar-intonation-checker": "sharp at the 12th fret open notes fine octave",
  "/guitar-intonation-guide": "fretted chords sound off sharp at the 12th fret",
  "/how-to-tune-a-guitar-by-ear": "no microphone no mic reference tone listen",
  "/capo-transposition-chart": "capo calculator song key shapes fret transposer",
  "/guitar-retuning-planner": "which strings move lower raise change preset",
  "/guitar-string-tension-calculator": "strings too loose tight tension when retuning",
  "/clip-on-vs-online-guitar-tuner": "hardware headstock tuner background noise",
  "/pedal-tuner-guide": "pedal tuner silent tune tuning onstage stage rehearsal mute bypass bass guitar",
  "/coated-vs-uncoated-acoustic-guitar-strings": "coated uncoated acoustic strings worth cost lifespan corrosion rust how long last",
  "/guitar-tuning-gear-guide": "buy replacement strings equipment gear",
};

const fillerWords = new Set(["a", "an", "are", "do", "does", "how", "i", "in", "is", "my", "the", "to", "what", "why"]);
const searchableItems = new Map();
for (const section of guideSections) {
  for (const link of section.querySelectorAll(".guide-list a")) {
    const path = link.getAttribute("href");
    searchableItems.set(link.parentElement, words(link.parentElement.textContent + " " + path + " " + (searchAliases[path] || "")).split(" "));
  }
}

function words(text) {
  return text.toLowerCase().replace(/♯/g, " sharp ").replace(/♭/g, " flat ")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

function filterGuides() {
  const tokens = words(guideSearch.value).split(" ").filter(Boolean);
  const meaningful = tokens.filter((word, index) => !fillerWords.has(word) ||
    (word === "a" && ["drop", "open", "standard"].includes(tokens[index - 1])));
  const query = meaningful.length ? meaningful : tokens;
  let count = 0;
  for (const section of guideSections) {
    let visible = 0;
    for (const list of section.querySelectorAll(".guide-list")) {
      let matches = 0;
      for (const item of list.children) {
        const terms = searchableItems.get(item);
        const show = query.every(word => terms.some(term => word.length <= 2 ? term === word : term.startsWith(word)));
        item.hidden = !show;
        if (show) matches++;
      }
      list.hidden = matches === 0;
      if (list.previousElementSibling?.tagName === "H3") {
        list.previousElementSibling.hidden = list.hidden;
      }
      visible += matches;
    }
    section.hidden = visible === 0;
    count += visible;
  }
  guideResults.textContent = query.length === 0 ? ""
    : count === 0 ? "No matches. Try a different tuning, instrument or symptom."
    : `${count} matching ${count === 1 ? "page" : "pages"}`;
}

guideSearch.addEventListener("input", filterGuides);
guideSearch.form.addEventListener("submit", event => event.preventDefault());
guideSearch.form.hidden = false;
