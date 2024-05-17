export function getSaneDevicePixelRatio() {
  //   return 1;
  return devicePixelRatio;
  return Math.min(2, devicePixelRatio);
}
