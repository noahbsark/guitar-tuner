const guideSearch = document.getElementById("guideSearch");
const guideResults = document.getElementById("guideResults");
const guideSections = [...document.querySelectorAll(".guide-group")];

function words(text) {
  return text.toLowerCase().replace(/♯/g, " sharp ").replace(/♭/g, " flat ")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

function filterGuides() {
  const query = words(guideSearch.value).split(" ").filter(Boolean);
  let count = 0;
  for (const section of guideSections) {
    let visible = 0;
    for (const list of section.querySelectorAll(".guide-list")) {
      let matches = 0;
      for (const item of list.children) {
        const terms = words(item.textContent + " " + item.querySelector("a").getAttribute("href"));
        const show = query.every(word => terms.includes(word));
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
