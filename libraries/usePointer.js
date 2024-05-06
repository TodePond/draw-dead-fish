import { Signal } from "./habitat.js";

/**
 * @type {{
 *  position: Signal<[number, number]>;
 * 	down: Signal<boolean>;
 * } | null}
 **/
let cached = null;

/**
 * @param {{
 *  element: HTMLElement;
 *  capture?: boolean;
 * }} options
 */
export function usePointer({ element = document.body, capture = true }) {
  if (cached) {
    return cached;
  }

  const pointer = {
    /** @type {Signal<[number, number]>} */
    position: new Signal([0, 0]),
    down: new Signal(false),
  };

  /** @param {PointerEvent} event */
  function updatePosition(event) {
    pointer.position.set([
      event.clientX * devicePixelRatio,
      event.clientY * devicePixelRatio,
    ]);
  }

  element.addEventListener("pointermove", updatePosition);
  element.addEventListener("pointerdown", (event) => {
    if (capture) {
      element.setPointerCapture(event.pointerId);
    }
    updatePosition(event);
    pointer.down.set(true);
  });
  element.addEventListener("pointerup", (event) => {
    if (capture) {
      element.releasePointerCapture(event.pointerId);
    }
    updatePosition(event);
    pointer.down.set(false);
  });

  cached = pointer;
  return pointer;
}
