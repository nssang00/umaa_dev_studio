// Pure layout constraints. The shell depends on this module; editor features do not.
export const STUDIO_PANE_LIMITS = Object.freeze({
  explorer: Object.freeze({ default: 274, min: 210, max: 480 }),
  properties: Object.freeze({ default: 292, min: 240, max: 540 }),
  workbenchMin: 360,
  splitterWidth: 8,
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const widthOrDefault = (value, fallback) => Number.isFinite(value) ? value : fallback;

export function fitStudioPanes(viewportWidth, preferred = {}) {
  const { explorer, properties, workbenchMin, splitterWidth } = STUDIO_PANE_LIMITS;
  const available = Math.max(explorer.min + properties.min, widthOrDefault(viewportWidth, 1280) - workbenchMin - splitterWidth * 2);
  let left = clamp(widthOrDefault(preferred.explorer, explorer.default), explorer.min, explorer.max);
  let right = clamp(widthOrDefault(preferred.properties, properties.default), properties.min, properties.max);
  const overflow = Math.max(0, left + right - available);
  if (overflow) {
    const leftRoom = left - explorer.min;
    const rightRoom = right - properties.min;
    const totalRoom = leftRoom + rightRoom;
    const leftCut = Math.min(leftRoom, totalRoom ? Math.floor(overflow * leftRoom / totalRoom) : 0);
    left -= leftCut;
    right -= Math.min(rightRoom, overflow - leftCut);
    left -= Math.min(left - explorer.min, Math.max(0, left + right - available));
  }
  return { explorer: left, properties: right };
}

export function resizeStudioPane(viewportWidth, preferred, side, requestedWidth) {
  if (!['explorer', 'properties'].includes(side)) return fitStudioPanes(viewportWidth, preferred);
  const current = fitStudioPanes(viewportWidth, preferred);
  const other = side === 'explorer' ? 'properties' : 'explorer';
  const limits = STUDIO_PANE_LIMITS[side];
  const available = widthOrDefault(viewportWidth, 1280) - STUDIO_PANE_LIMITS.workbenchMin - STUDIO_PANE_LIMITS.splitterWidth * 2;
  const largest = Math.max(limits.min, Math.min(limits.max, available - current[other]));
  return { ...current, [side]: clamp(widthOrDefault(requestedWidth, current[side]), limits.min, largest) };
}
