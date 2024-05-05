import { Signal, equals, registerDotDee, use } from "../libraries/habitat.js";
import { LEVEL_PROGRESS_LOCAL_STORAGE_KEY } from "../script/save.js";
import { useContext } from "./useContext.js";
import { usePointer } from "./usePointer.js";

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

const pointer = usePointer(context.canvas);

const oneDraw = new Signal(false);
const faded = new Signal(false);
/** @type {[number, number] | null} */
let previousPosition = null;
use(() => {
  if (phase.get() !== "game") return;
  if (!pointer.down.get()) {
    previousPosition = null;
    return;
  }
  if (!oneDraw.get()) {
    oneDraw.set(true);
    document.body.classList.add("fade-to-black");
    setTimeout(() => {
      faded.set(true);
    }, 2000);
  }
  const [x, y] = pointer.position.get();
  if (!previousPosition) {
    previousPosition = [x, y];
    paintLine([x, y]);
    return;
  }

  if (equals([x, y], previousPosition)) return;
  paintLine(previousPosition, [x, y]);
  previousPosition = [x, y];
}, [phase, pointer.down, pointer.position]);

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
  if (!faded.get()) return;
  footer?.style.setProperty(
    "display",
    phase.get() === "game" ? "flex" : "none"
  );
}, [phase, oneDraw, faded]);

const audio = new Audio("/audio/see-the-art.mp3");
submitButton?.addEventListener("click", (event) => {
  phase.set("finish");
  event.stopPropagation();
  event.preventDefault();
  const progress = JSON.parse(
    localStorage.getItem(LEVEL_PROGRESS_LOCAL_STORAGE_KEY) ?? "[]"
  );

  if (!progress.includes(3)) {
    progress.push(3);
  }

  progress.sort((a, b) => a - b);

  localStorage.setItem(
    LEVEL_PROGRESS_LOCAL_STORAGE_KEY,
    JSON.stringify(progress)
  );

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  document.body.classList.add("fade-to-white");
  article?.classList.add("fade-out");
  // setTimeout(() => {
  //   // document.body.classList.remove("fade-to-white");
  //   document.body.classList.add("fade-out");
  // }, 5000);

  audio.play();

  setTimeout(() => {
    location.href = "/";
  }, 5000);
});
