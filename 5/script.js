import { Signal, equals, registerDotDee, use } from "../libraries/habitat.js";
import { usePointer } from "../libraries/usePointer.js";
import { LEVEL_PROGRESS_LOCAL_STORAGE_KEY } from "../script/save.js";
import { useContext } from "./useContext.js";

registerDotDee();

// const context = useContext();

/** @type {Signal<[number, number]>} */
const windowDimensions = new Signal([innerWidth, innerHeight]);

addEventListener("resize", () =>
  windowDimensions.set([innerWidth, innerHeight])
);

// const extraCanvas = document.createElement("canvas");
// const extraContext = extraCanvas.getContext("2d");
// use(() => {
//   const [width, height] = windowDimensions.get();
//   const { canvas } = context;
//   if (!extraContext) {
//     throw new Error("Could not get 2d context from canvas");
//   }
//   extraCanvas.width = canvas.width;
//   extraCanvas.height = canvas.height;
//   extraContext.drawImage(canvas, 0, 0);
//   canvas.width = width * devicePixelRatio;
//   canvas.height = height * devicePixelRatio;
//   context.drawImage(extraCanvas, 0, 0, canvas.width, canvas.height);
// }, [windowDimensions]);

/** @type {Signal<"menu" | "game" | "finish">} */
const phase = new Signal("menu");

use(() => {
  const main = document.querySelector("main");
  main?.style.setProperty("display", phase.get() === "menu" ? "flex" : "none");
}, [phase]);

document
  .querySelector("#start")
  ?.addEventListener("click", () => phase.set("game"));

// const pointer = usePointer({ element: context.canvas });

const oneDraw = new Signal(false);

/** @type {[number, number] | null} */
// let previousPosition = null;
// use(() => {
//   if (phase.get() !== "game") return;
//   if (!pointer.down.get()) {
//     previousPosition = null;
//     return;
//   }
//   if (!oneDraw.get()) {
//     oneDraw.set(true);
//   }
//   const [x, y] = pointer.position.get();
//   if (!previousPosition) {
//     previousPosition = [x, y];
//     paintLine([x, y]);
//     return;
//   }

//   if (equals([x, y], previousPosition)) return;
//   paintLine(previousPosition, [x, y]);
//   previousPosition = [x, y];
// }, [phase, pointer.down, pointer.position]);

/**
 * @param {[number, number]} start
 * @param {[number, number]} end
 */
// function paintLine(start, end = start) {
//   context.strokeStyle = "black";
//   context.lineWidth = 20 * devicePixelRatio;
//   context.lineCap = "round";
//   context.beginPath();
//   context.moveTo(...start);
//   context.lineTo(...end);
//   context.stroke();
//   context.closePath();
// }

const footer = document.querySelector("footer");
const article = document.querySelector("article");
const submitButton = document.querySelector("#submit");
use(() => {
  article?.style.setProperty(
    "display",
    phase.get() === "finish" ? "flex" : "none"
  );
}, [phase]);

use(() => {
  if (!oneDraw.get()) return;
  footer?.style.setProperty(
    "display",
    phase.get() === "game" ? "flex" : "none"
  );
}, [phase, oneDraw]);

use(
  (done) => {
    if (done) return;
    if (phase.get() !== "game") return;
    // Fill canvas with grid of checkboxes
    const ROWS = 10;
    const COLS = 20;
    const form = document.querySelector("form");
    for (let y = 0; y < ROWS; y++) {
      const row = document.createElement("hgroup");
      row.style.setProperty("display", "flex");
      row.style.setProperty("justify-content", "space-between");
      row.style.setProperty("width", "100%");

      form?.appendChild(row);
      for (let x = 0; x < COLS; x++) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        row.appendChild(checkbox);
        // checkbox.style.setProperty("width", "30px");
        // checkbox.style.setProperty("height", "30px");
        // checkbox.style.setProperty("max-height", "50%");
        // checkbox.style.setProperty("flex-shrink", "0");
      }
    }
    const checkboxes = document.querySelectorAll("input[type=checkbox]");
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        if (oneDraw.get()) return;
        oneDraw.set(true);
      });
    });
    return true;
  },
  [phase]
);

const audio = new Audio("forget-the-ui.mp3");
submitButton?.addEventListener("click", (event) => {
  phase.set("finish");
  event.stopPropagation();
  event.preventDefault();
  const progress = JSON.parse(
    localStorage.getItem(LEVEL_PROGRESS_LOCAL_STORAGE_KEY) ?? "[]"
  );

  const levelNumber = getLevelNumberFromURL();
  console.log(levelNumber);
  if (!progress.includes(levelNumber)) {
    progress.push(levelNumber);
  }

  progress.sort((a, b) => a - b);

  localStorage.setItem(
    LEVEL_PROGRESS_LOCAL_STORAGE_KEY,
    JSON.stringify(progress)
  );

  document.body.classList.add("fade-out");
  audio.play();

  setTimeout(() => {
    location.href = "/";
  }, 10000);
});

// eg: "http://localhost:8080/5/" -> 5
function getLevelNumberFromURL() {
  return Number(location.pathname.split("/")[1]);
}
