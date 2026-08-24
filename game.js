const MAP_FILE = "./maps/germany-states.geojson";

const stateNames = {
  "01": "Schleswig-Holstein",
  "02": "Hamburg",
  "03": "Niedersachsen",
  "04": "Bremen",
  "05": "Nordrhein-Westfalen",
  "06": "Hessen",
  "07": "Rheinland-Pfalz",
  "08": "Baden-Württemberg",
  "09": "Bayern",
  "10": "Saarland",
  "11": "Berlin",
  "12": "Brandenburg",
  "13": "Mecklenburg-Vorpommern",
  "14": "Sachsen",
  "15": "Sachsen-Anhalt",
  "16": "Thüringen"
};

let mapData;
let questions = [];
let currentQuestion;
let score = 0;
let time = 120;
let locked = false;
let timer;

const svg = d3.select("#map");

const target = document.getElementById("target");
const scoreElement = document.getElementById("score");
const timeElement = document.getElementById("time");
const message = document.getElementById("message");
const nextButton = document.getElementById("next");
const newGameButton = document.getElementById("newGame");


async function loadMap() {

  try {

    const response = await fetch(MAP_FILE);

    if (!response.ok) {
      throw new Error("Could not load GeoJSON");
    }

    mapData = await response.json();

    drawMap();

    startGame();

  } catch (error) {

    console.error(error);

    message.textContent =
      "Map failed to load. Check maps/germany-states.geojson";

  }
}


function drawMap() {

  const projection = d3
    .geoMercator()
    .fitSize([760, 760], mapData);

  const path = d3
    .geoPath()
    .projection(projection);

  svg
    .selectAll(".state")
    .data(mapData.features)
    .join("path")
    .attr("class", "state")
    .attr("d", path)
    .attr("data-state-id", feature => {

      return feature.properties.SN_L;

    })
    .on("click", function(event, feature) {

      chooseState(feature.properties.SN_L);

    });
}


function shuffle(array) {

  return [...array].sort(() => Math.random() - 0.5);

}


function startGame() {

  clearInterval(timer);

  score = 0;

  time = 120;

  locked = false;

  questions = shuffle(
    Object.entries(stateNames)
  );

  svg
    .selectAll(".state")
    .classed("correct", false)
    .classed("wrong", false)
    .classed("answer", false);

  scoreElement.textContent =
    `0 / 16`;

  nextButton.disabled = true;

  updateTimer();

  nextQuestion();

  timer = setInterval(() => {

    time--;

    updateTimer();

    if (time <= 0) {
      endGame();
    }

  }, 1000);
}


function nextQuestion() {

  if (!questions.length) {

    finishGame();

    return;

  }

  const question = questions.shift();

  currentQuestion = {
    id: question[0],
    name: question[1]
  };

  locked = false;

  nextButton.disabled = true;

  target.textContent =
    currentQuestion.name;

  message.textContent =
    "Find it on the map.";
}


function chooseState(id) {

  if (locked || time <= 0) {
    return;
  }

  locked = true;

  const clicked = svg.select(
    `[data-state-id="${id}"]`
  );

  if (id === currentQuestion.id) {

    score++;

    clicked.classed(
      "correct",
      true
    );

    message.textContent =
      "Correct! 🎉";

  } else {

    clicked.classed(
      "wrong",
      true
    );

    svg
      .select(
        `[data-state-id="${currentQuestion.id}"]`
      )
      .classed(
        "answer",
        true
      );

    message.textContent =
      `Wrong! The answer is ${currentQuestion.name}.`;
  }

  scoreElement.textContent =
    `${score} / 16`;

  nextButton.disabled = false;
}


function updateTimer() {

  const minutes =
    Math.floor(time / 60)
      .toString()
      .padStart(2, "0");

  const seconds =
    (time % 60)
      .toString()
      .padStart(2, "0");

  timeElement.textContent =
    `${minutes}:${seconds}`;
}


function endGame() {

  clearInterval(timer);

  locked = true;

  nextButton.disabled = true;

  message.textContent =
    `Time's up! You found ${score} of 16.`;
}


function finishGame() {

  clearInterval(timer);

  locked = true;

  nextButton.disabled = true;

  message.textContent =
    `Finished! You found ${score} of 16! 🎉`;
}


nextButton.addEventListener(
  "click",
  nextQuestion
);


newGameButton.addEventListener(
  "click",
  startGame
);


loadMap();
