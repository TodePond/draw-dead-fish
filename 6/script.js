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
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(extraCanvas, 0, 0, canvas.width, canvas.height);
}, [windowDimensions]);

/** @type {Signal<"menu" | "game" | "finish" | "post">} */
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
  if (phase.get() !== "game") return;
  if (!pointer.down.get()) {
    previousPosition = null;
    return;
  }
  if (!oneDraw.get()) {
    oneDraw.set(true);
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

let drawingTop = Infinity;
let drawingBottom = 0;
let crushStartTime = null;
let drawingCanvas = null;
// const CRUSH_DURATION = 2
const CRUSH_DURATION = 43; //seconds
/** @param {number} time */
function crushTick(time) {
  if (crushStartTime === null) crushStartTime = time;
  const progress = (time - crushStartTime) / (CRUSH_DURATION * 1000);
  if (progress > 1) {
    crushStartTime = null;
    setTimeout(() => {
      document.body.classList.add("fade-out");
      article?.style.setProperty("display", "flex");

      setTimeout(() => {
        location.href = "/";
      }, 10000);
      requestAnimationFrame(uncrushTick);
    }, 2000);
    return;
  }
  context.fillStyle = "white";
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);

  const crusherHeight = (context.canvas.height / 2) * progress;

  let realTop = drawingTop;
  let realHeight = drawingBottom - drawingTop;

  const isPushedDown = realTop < crusherHeight;
  if (isPushedDown) {
    realTop = crusherHeight;
  }

  const isPushedUp =
    realTop + realHeight > context.canvas.height - crusherHeight;
  if (isPushedUp && isPushedDown) {
    realHeight = context.canvas.height - crusherHeight - crusherHeight;
  } else if (isPushedUp) {
    realTop = context.canvas.height - crusherHeight - realHeight;
    const isNowPushedDown = realTop < crusherHeight;
    if (isNowPushedDown) {
      realTop = crusherHeight;
      realHeight = context.canvas.height - crusherHeight - crusherHeight;
    }
  }

  context.drawImage(
    drawingCanvas,
    0,
    realTop,
    context.canvas.width,
    realHeight
  );

  context.fillStyle = "black";
  context.fillRect(0, 0, context.canvas.width, crusherHeight);

  context.fillRect(
    0,
    context.canvas.height - crusherHeight,
    context.canvas.width,
    crusherHeight
  );

  requestAnimationFrame(crushTick);
}

let uncrushStartTime = null;
const UNCRUSH_DURATION = 10;
/** @param {number} time */
function uncrushTick(time) {
  if (uncrushStartTime === null) uncrushStartTime = time;
  const progress = (time - uncrushStartTime) / (UNCRUSH_DURATION * 1000);

  if (progress > 1) {
    phase.set("post");
    return;
  }

  context.fillStyle = "white";
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);

  const crusherHeight =
    context.canvas.height / 2 - (context.canvas.height / 2) * progress;

  context.fillStyle = "black";
  context.fillRect(0, 0, context.canvas.width, crusherHeight);

  context.fillRect(
    0,
    context.canvas.height - crusherHeight,
    context.canvas.width,
    crusherHeight
  );

  requestAnimationFrame(uncrushTick);
}

use(() => {
  // article?.style.setProperty(
  //   "display",
  //   phase.get() === "finish" ? "flex" : "none"
  // );

  if (phase.get() !== "finish") return;

  const imageData = context.getImageData(
    0,
    0,
    context.canvas.width,
    context.canvas.height
  );

  for (let i = 0; i < imageData.data.length; i += 4) {
    const pixel = imageData.data[i];
    if (pixel === 255) continue;
    const y = Math.floor(i / (imageData.width * 4));
    drawingTop = Math.min(drawingTop, y);
    drawingBottom = Math.max(drawingBottom, y);
  }

  drawingCanvas = document.createElement("canvas");
  drawingCanvas.width = context.canvas.width;
  drawingCanvas.height = drawingBottom - drawingTop;
  const drawingContext = drawingCanvas.getContext("2d");
  if (!drawingContext) {
    throw new Error("Could not get 2d context from canvas");
  }
  drawingContext.drawImage(
    context.canvas,
    0,
    drawingTop,
    context.canvas.width,
    drawingBottom,
    0,
    0,
    context.canvas.width,
    drawingBottom
  );

  setTimeout(() => {
    requestAnimationFrame(crushTick);
  }, 5000);
  // }, 100);
}, [phase]);

use(() => {
  if (!oneDraw.get()) return;
  footer?.style.setProperty(
    "display",
    phase.get() === "game" ? "flex" : "none"
  );
}, [phase, oneDraw]);

const audio = new Audio("thinnest.mp3");
submitButton?.addEventListener("click", (event) => {
  phase.set("finish");
  event.stopPropagation();
  event.preventDefault();
  const progress = JSON.parse(
    localStorage.getItem(LEVEL_PROGRESS_LOCAL_STORAGE_KEY) ?? "[]"
  );

  // eg: "http://localhost:8080/5/" -> 5
  function getLevelNumberFromURL() {
    return Number(location.pathname.split("/")[1]);
  }

  const levelNumber = getLevelNumberFromURL();
  if (!progress.includes(levelNumber)) {
    progress.push(levelNumber);
  }

  progress.sort((a, b) => a - b);

  localStorage.setItem(
    LEVEL_PROGRESS_LOCAL_STORAGE_KEY,
    JSON.stringify(progress)
  );

  audio.play();

  // setTimeout(() => {
  //   location.href = "/";
  // }, 10000);
});
