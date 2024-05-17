/** @type {CanvasRenderingContext2D | null} */
let cached = null;

export function useContext() {
  if (cached) {
    return cached;
  }

  const canvas = document.querySelector("canvas");
  if (!canvas) {
    throw new Error("Canvas element not found");
  }
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not get 2d context from canvas");
  }
  cached = context;
  return context;
}
