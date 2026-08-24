const states = [
  ["BW", "Baden-Württemberg"],
  ["BY", "Bayern"],
  ["BE", "Berlin"],
  ["BB", "Brandenburg"],
  ["HB", "Bremen"],
  ["HH", "Hamburg"],
  ["HE", "Hessen"],
  ["MV", "Mecklenburg-Vorpommern"],
  ["NI", "Niedersachsen"],
  ["NW", "Nordrhein-Westfalen"],
  ["RP", "Rheinland-Pfalz"],
  ["SL", "Saarland"],
  ["SN", "Sachsen"],
  ["ST", "Sachsen-Anhalt"],
  ["SH", "Schleswig-Holstein"],
  ["TH", "Thüringen"]
];

/*
  Temporary schematic map.

  The next version should replace these shapes
  with REAL German geographic boundaries.
*/

const paths = {

  SH:
    "M250 45 L365 30 L430 70 L390 150 L300 145 L250 100Z",

  MV:
    "M365 150 L500 115 L555 180 L500 225 L390 205Z",

  HH:
    "M285 165 L315 160 L320 190 L290 195Z",

  NI:
    "M150 145 L250 130 L300 145 L285 220 L225 255 L135 220 L110 175Z",

  HB:
    "M160 205 L180 205 L178 235 L158 235Z",

  BB:
    "M390 245 L510 230 L545 330 L475 390 L385 345Z",

  BE:
    "M430 275 L455 275 L460 300 L430 305Z",

  NW:
    "M75 245 L160 225 L225 260 L205 345 L125 355 L70 310Z",

  HE:
    "M220 300 L300 285 L340 350 L290 410 L210 380Z",

  TH:
    "M315 350 L390 345 L410 405 L350 435 L300 400Z",

  SN:
    "M405 395 L500 385 L525 450 L450 485 L390 440Z",

  ST:
    "M320 245 L400 225 L425 315 L385 350 L315 325Z",

  RP:
    "M150 360 L220 375 L250 455 L200 505 L135 450Z",

  SL:
    "M150 475 L190 470 L200 510 L160 525Z",

  BW:
    "M220 450 L300 420 L370 455 L350 565 L270 620 L200 535Z",

  BY:
    "M350 465 L450 475 L535 535 L500 650 L390 690 L320 600Z"
};


// Create map
const svg = document.getElementById("map");

for (const [id, name] of states) {

  const path = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );

  path.id = id;
  path.dataset.name = name;
  path.classList.add("country");

  path.setAttribute("d", paths[id]);

  path.addEventListener("click", () => {
    choose(id);
  });

  svg.appendChild(path);
}


// Game variables
let remaining = [];
let current = null;
let score = 0;
let time = 120;
let locked = false;
let timer;


// UI
const target = document.getElementById("target");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const message = document.getElementById("message");
const next = document.getElementById("next");


// Shuffle questions
function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}


// Start game
function start() {

  clearInterval(timer);

  remaining = shuffle(states);

  score = 0;
  time = 120;
  locked = false;

  document
    .querySelectorAll(".country")
    .forEach(x => x.className = "country");

  scoreEl.textContent = `0 / ${states.length}`;

  next.disabled = true;

  nextQuestion();

  timer = setInterval(() => {

    time--;

    renderTime();

    if (time <= 0) {
      end();
    }

  }, 1000);
}


// Next question
function nextQuestion() {

  if (!remaining.length) {
    finish();
    return;
  }

  current = remaining.shift();

  locked = false;

  next.disabled = true;

  target.textContent = current[1];

  message.textContent =
    "Click the correct state.";
}


// Player clicks a state
function choose(id) {

  if (locked || time <= 0) {
    return;
  }

  locked = true;

  const element = document.getElementById(id);

  if (id === current[0]) {

    score++;

    element.classList.add("correct");

    message.textContent =
      "Correct! 🎉";

    scoreEl.textContent =
      `${score} / ${states.length}`;

  } else {

    element.classList.add("wrong");

    document
      .getElementById(current[0])
      .classList.add("found");

    message.textContent =
      `Not quite — ${current[1]} is highlighted.`;
  }

  next.disabled = false;
}


// Next button
next.onclick = nextQuestion;


// New game
document
  .getElementById("newGame")
  .onclick = start;


// Timer
function renderTime() {

  const minutes =
    String(Math.floor(time / 60)).padStart(2, "0");

  const seconds =
    String(time % 60).padStart(2, "0");

  timeEl.textContent =
    `${minutes}:${seconds}`;
}


// Time over
function end() {

  clearInterval(timer);

  locked = true;

  next.disabled = true;

  message.textContent =
    `Time's up! You found ${score} of ${states.length}.`;
}


// Completed
function finish() {

  clearInterval(timer);

  locked = true;

  next.disabled = true;

  message.textContent =
    `Finished! You found ${score} of ${states.length}.`;
}


// Start immediately
start();
