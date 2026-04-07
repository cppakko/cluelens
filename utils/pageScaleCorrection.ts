export function computeZoomCorrection(shadowHost: Element): number {
  let cumulativeZoom = 1;
  let el: Element | null = shadowHost;

  while (el) {
    try {
      const style = getComputedStyle(el);
      const z = parseFloat(style.zoom);
      if (!isNaN(z) && z > 0) {
        cumulativeZoom *= z;
      }
    } catch {
      console.warn('Failed to compute zoom for element', el);
    }
    el = el.parentElement;
  }

  if (Math.abs(cumulativeZoom - 1) < 0.001) {
    return 1;
  }

  return 1 / cumulativeZoom;
}
