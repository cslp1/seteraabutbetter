const levels = {

  states: {
    name: "Bundesländer",
    file: "./maps/germany-states.geojson"
  },

  districts: {
    name: "Regierungsbezirke",
    file: "./maps/germany-regierungsbezirke.geojson"
  },

  counties: {
    name: "Landkreise & kreisfreie Städte",
    file: "./maps/germany-kreise.geojson"
  }

};


let currentLevel = "states";

let mapData = null;

let questions = [];

let currentQuestion = null;

let score = 0;

let time = 120;

let locked = false;

let timer = null;


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


/* =====================================
   GET REGION NAME
===================================== */

function getName(feature) {

  const properties =
    feature.properties || {};


  const preferredFields = [

    "name",

    "NAME",

    "Name",

    "GEN",

    "GEN_L",

    "NAM",

    "BEZ",

    "BEZIRK",

    "REGIERUNGSBEZIRK",

    "regierungsbezirk",

    "NL_NAME",

    "NAME_1",

    "NAME_2",

    "VARNAME"

  ];


  for (
    const field
    of preferredFields
  ) {

    const value =
      properties[field];


    if (
      typeof value === "string" &&
      value.trim() !== ""
    ) {

      return value.trim();

    }

  }


  /*
    Fallback:
    Find any useful text property.
  */

  for (
    const [key, value]
    of Object.entries(properties)
  ) {

    if (
      typeof value === "string" &&
      value.trim() !== "" &&
      value.length < 100 &&
      !/^\d+$/.test(value.trim())
    ) {

      return value.trim();

    }

  }


  return "Unknown region";
}


/* =====================================
   GET ID
===================================== */

function getId(
  feature,
  index
) {

  const properties =
    feature.properties || {};


  const possibleIds = [

    feature.id,

    properties.id,

    properties.ID,

    properties.OBJECTID,

    properties.ARS,

    properties.AGS,

    properties.SN_L,

    properties.SN_K,

    properties.SN_R

  ];


  for (
    const id
    of possibleIds
  ) {

    if (
      id !== undefined &&
      id !== null &&
      String(id).trim() !== ""
    ) {

      return String(id);

    }

  }


  return String(index);
}


/* =====================================
   LOAD MAP
===================================== */

async function loadMap() {

  clearInterval(timer);


  target.textContent =
    "Loading...";


  message.textContent =
    "Loading map...";


  try {

    const response =
      await fetch(
        levels[currentLevel].file
      );


    if (!response.ok) {

      throw new Error(
        `Could not load ${levels[currentLevel].file}`
      );

    }


    mapData =
      await response.json();


    if (
      !mapData.features ||
      mapData.features.length === 0
    ) {

      throw new Error(
        "The GeoJSON contains no features."
      );

    }


    console.log(
      "CURRENT LEVEL:",
      currentLevel
    );


    console.log(
      "FEATURES:",
      mapData.features.length
    );


    console.log(
      "FIRST FEATURE:",
      mapData.features[0]
    );


    console.log(
      "PROPERTIES:",
      mapData.features[0].properties
    );


    drawMap();

    startGame();

  }


  catch (error) {

    console.error(error);


    target.textContent =
      "Map error";


    message.textContent =
      "The map could not be loaded.";

  }

}


/* =====================================
   DRAW MAP
===================================== */

function drawMap() {

  svg
    .selectAll("*")
    .remove();


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
        getId(
          feature,
          index
        )
    )

    .attr(
      "title",
      feature =>
        getName(feature)
    )

    .on(
      "click",
      function(event, feature) {

        const index =
          mapData.features.indexOf(
            feature
          );


        chooseRegion(
          getId(
            feature,
            index
          )
        );

      }
    );

}


/* =====================================
   SHUFFLE
===================================== */

function shuffle(array) {

  return [...array].sort(
    () => Math.random() - 0.5
  );

}


/* =====================================
   START GAME
===================================== */

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


/* =====================================
   NEXT QUESTION
===================================== */

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


/* =====================================
   CHOOSE REGION
===================================== */

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
      `[data-id="${CSS.escape(id)}"]`
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

  }


  else {

    clicked.classed(
      "wrong",
      true
    );


    const correct =
      svg.select(
        `[data-id="${CSS.escape(
          currentQuestion.id
        )}"]`
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


/* =====================================
   TIMER
===================================== */

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


/* =====================================
   END GAME
===================================== */

function endGame() {

  clearInterval(timer);

  locked = true;

  nextButton.disabled =
    true;


  message.textContent =
    `Time's up! You found ${score} of ${mapData.features.length}.`;

}


/* =====================================
   FINISH GAME
===================================== */

function finishGame() {

  clearInterval(timer);

  locked = true;

  nextButton.disabled =
    true;


  message.textContent =
    `Finished! You found ${score} of ${mapData.features.length}! 🎉`;

}


/* =====================================
   NEXT BUTTON
===================================== */

nextButton.addEventListener(
  "click",
  nextQuestion
);


/* =====================================
   NEW GAME
===================================== */

newGameButton.addEventListener(
  "click",
  startGame
);


/* =====================================
   LEVEL SWITCHING
===================================== */

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


/* =====================================
   START
===================================== */

loadMap();
