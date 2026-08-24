const levels = {

  states: {
    name: "Bundesländer",
    file: "./maps/germany-states.geojson"
  },

  districts: {
    name: "Regierungsbezirke",
    file: "./maps/germany-regierungsbezirke.geojson"
  }

};


let currentLevel = "states";

let mapData;

let questions = [];

let currentQuestion;

let score = 0;

let time = 120;

let locked = false;

let timer;


const svg =
  d3.select("#map");

const target =
  document.getElementById("target");

const scoreElement =
  document.getElementById("score");

const timeElement =
  document.getElementById("time");

const message =
  document.getElementById("message");

const nextButton =
  document.getElementById("next");

const newGameButton =
  document.getElementById("newGame");

const levelTitle =
  document.getElementById("levelTitle");

const levelButtons =
  document.querySelectorAll(".level");


/*
================================
GET NAME FROM GEOJSON
================================
*/

function getName(feature) {

  const p =
    feature.properties || {};

  return (
    p.name ||
    p.NAME ||
    p.NAM ||
    p.GEN ||
    p.NL_NAME ||
    p.BEZ ||
    p.GEN_L ||
    p.ars_name ||
    "Unknown region"
  );
}


/*
================================
GET UNIQUE ID
================================
*/

function getId(feature, index) {

  const p =
    feature.properties || {};

  return String(
    feature.id ||
    p.id ||
    p.ID ||
    p.OBJECTID ||
    p.ARS ||
    p.AGS ||
    index
  );

}


/*
================================
LOAD MAP
================================
*/

async function loadMap() {

  clearInterval(timer);

  message.textContent =
    "Loading map...";

  target.textContent =
    "Loading...";


  try {

    const response =
      await fetch(
        levels[currentLevel].file
      );


    if (!response.ok) {

      throw new Error(
        "Could not load GeoJSON"
      );

    }


    mapData =
      await response.json();


    drawMap();

    startGame();


  } catch (error) {

    console.error(error);

    message.textContent =
      "Map could not be loaded.";

  }

}


/*
================================
DRAW MAP
================================
*/

function drawMap() {

  svg.selectAll("*").remove();


  const projection =
    d3.geoMercator()
      .fitSize(
        [760, 760],
        mapData
      );


  const path =
    d3.geoPath()
      .projection(projection);


  svg
    .selectAll(".state")
    .data(mapData.features)
    .join("path")

    .attr(
      "class",
      "state"
    )

    .attr(
      "d",
      path
    )

    .attr(
      "data-id",
      (feature, index) =>
        getId(feature, index)
    )

    .on(
      "click",
      function(event, feature) {

        chooseRegion(
          getId(
            feature,
            mapData.features.indexOf(feature)
          )
        );

      }
    );

}


/*
================================
SHUFFLE
================================
*/

function shuffle(array) {

  return [...array]
    .sort(
      () => Math.random() - 0.5
    );

}


/*
================================
START GAME
================================
*/

function startGame() {

  clearInterval(timer);

  score = 0;

  time = 120;

  locked = false;


  questions =
    shuffle(
      mapData.features.map(
        (feature, index) => ({

          id:
            getId(
              feature,
              index
            ),

          name:
            getName(feature)

        })
      )
    );


  svg
    .selectAll(".state")
    .classed(
      "correct",
      false
    )
    .classed(
      "wrong",
      false
    )
    .classed(
      "answer",
      false
    );


  scoreElement.textContent =
    `0 / ${questions.length}`;


  levelTitle.textContent =
    levels[currentLevel].name;


  nextButton.disabled =
    true;


  updateTimer();

  nextQuestion();


  timer =
    setInterval(
      () => {

        time--;

        updateTimer();


        if (time <= 0) {

          endGame();

        }

      },
      1000
    );

}


/*
================================
NEXT QUESTION
================================
*/

function nextQuestion() {

  if (!questions.length) {

    finishGame();

    return;

  }


  currentQuestion =
    questions.shift();


  locked = false;


  nextButton.disabled =
    true;


  target.textContent =
    currentQuestion.name;


  message.textContent =
    "Find it on the map.";

}


/*
================================
ANSWER
================================
*/

function chooseRegion(id) {

  if (
    locked ||
    time <= 0
  ) {

    return;

  }


  locked = true;


  const clicked =
    svg.select(
      `[data-id="${id}"]`
    );


  if (
    id === currentQuestion.id
  ) {

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


    const correct =
      svg.select(
        `[data-id="${currentQuestion.id}"]`
      );


    correct.classed(
      "answer",
      true
    );


    message.textContent =
      `Wrong! The answer was ${currentQuestion.name}.`;

  }


  scoreElement.textContent =
    `${score} / ${mapData.features.length}`;


  nextButton.disabled =
    false;

}


/*
================================
TIMER
================================
*/

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


/*
================================
GAME OVER
================================
*/

function endGame() {

  clearInterval(timer);

  locked = true;

  nextButton.disabled =
    true;


  message.textContent =
    `Time's up! You found ${score} of ${mapData.features.length}.`;

}


function finishGame() {

  clearInterval(timer);

  locked = true;

  nextButton.disabled =
    true;


  message.textContent =
    `Finished! You found ${score} of ${mapData.features.length}! 🎉`;

}


/*
================================
NEXT BUTTON
================================
*/

nextButton.addEventListener(
  "click",
  nextQuestion
);


/*
================================
NEW GAME
================================
*/

newGameButton.addEventListener(
  "click",
  startGame
);


/*
================================
LEVEL BUTTONS
================================
*/

levelButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        currentLevel =
          button.dataset.level;


        levelButtons.forEach(
          b =>
            b.classList.remove(
              "active"
            )
        );


        button.classList.add(
          "active"
        );


        loadMap();

      }
    );

  }
);


/*
================================
START
================================
*/

loadMap();
