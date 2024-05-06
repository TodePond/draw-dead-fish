import { Signal, equals, registerDotDee, use } from "../libraries/habitat.js";
import { usePointer } from "../libraries/usePointer.js";
import { LEVEL_PROGRESS_LOCAL_STORAGE_KEY } from "../script/save.js";
import { useContext } from "./useContext.js";

registerDotDee();

const context = useContext();

/** @type {Signal<[number, number]>} */
const windowDimensions = new Signal([innerWidth, innerHeight]);

addEventListener("resize", () =>
  windowDimensions.set([innerWidth, innerHeight])
);

const extraCanvas = document.createElement("canvas");
const extraContext = extraCanvas.getContext("2d");
use(() => {
  const [width, height] = windowDimensions.get();
  const { canvas } = context;
  if (!extraContext) {
    throw new Error("Could not get 2d context from canvas");
  }
  extraCanvas.width = canvas.width;
  extraCanvas.height = canvas.height;
  extraContext.drawImage(canvas, 0, 0);
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  context.drawImage(extraCanvas, 0, 0, canvas.width, canvas.height);
}, [windowDimensions]);

/** @type {Signal<"menu" | "game" | "finish">} */
const phase = new Signal("menu");

use(() => {
  const main = document.querySelector("main");
  main?.style.setProperty("display", phase.get() === "menu" ? "flex" : "none");
}, [phase]);

document
  .querySelector("#start")
  ?.addEventListener("click", () => phase.set("game"));

const pointer = usePointer({ element: context.canvas });

const oneDraw = new Signal(false);

/** @type {[number, number] | null} */
let previousPosition = null;
use(() => {
  agnosticDraw({ down: pointer.down.get(), position: pointer.position.get() });
}, [phase, pointer.down, pointer.position]);

/**
 *
 * @param {{
 *  down: boolean,
 *  position: [number, number]
 * }} options
 * @returns
 */
function agnosticDraw({ down, position }) {
  setTimeout(() => {
    if (phase.get() !== "game") return;
    if (!down) {
      previousPosition = null;
      return;
    }
    if (!oneDraw.get()) {
      oneDraw.set(true);
    }
    const [x, y] = position;
    if (!previousPosition) {
      previousPosition = [x, y];
      paintLine([x, y]);
      return;
    }

    if (equals([x, y], previousPosition)) return;
    paintLine(previousPosition, [x, y]);
    previousPosition = [x, y];
  }, 2000);
}

/**
 * @param {[number, number]} start
 * @param {[number, number]} end
 */
function paintLine(start, end = start) {
  context.strokeStyle = "black";
  context.lineWidth = 20 * devicePixelRatio;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(...start);
  context.lineTo(...end);
  context.stroke();
  context.closePath();
}

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

const audio = new Audio("/audio/deeply-unartistic.mp3");
submitButton?.addEventListener("click", (event) => {
  phase.set("finish");
  event.stopPropagation();
  event.preventDefault();
  const progress = JSON.parse(
    localStorage.getItem(LEVEL_PROGRESS_LOCAL_STORAGE_KEY) ?? "[]"
  );

  if (!progress.includes(2)) {
    progress.push(2);
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
  }, 5000);
});
