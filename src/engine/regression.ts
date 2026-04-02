/**
 * Linear regression engine for FC current sensor calibration.
 *
 * The FC current sensor firmware formula (Betaflight / iNav):
 *   displayed_amps = (V_mV − offset) × 10 / scale
 *
 * Rearranged to recover voltage from a displayed reading:
 *   V_mV = displayed_amps × scale / 10 + offset
 *
 * Given paired measurements of (true_current, fc_displayed_current)
 * and the FC's current scale/offset settings, we:
 *   1. Back-calculate the ADC voltage (mV) from what the FC displays
 *   2. Run least-squares linear regression: true_current = slope × V_mV + intercept
 *   3. Derive new firmware params: new_scale = 10 / slope, new_offset = −intercept / slope
 */

export interface DataPoint {
  x: number; // ADC voltage in millivolts
  y: number; // true current (amps)
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number; // coefficient of determination (fit quality)
}

export interface CalibrationResult {
  newScale: number;
  newOffset: number;
  rSquared: number;
  slope: number;
  intercept: number;
  dataPoints: DataPoint[]; // for charting
  regressionLine: { x1: number; y1: number; x2: number; y2: number };
  oldCalibrationLine: { x1: number; y1: number; x2: number; y2: number };
}

/**
 * Convert an FC-displayed current reading back to the ADC sensor voltage (mV)
 * using the FC's current calibration parameters.
 *
 * The firmware computes: displayed_amps = (V_mV − offset) × 10 / scale
 * Rearranging:           V_mV = displayed_amps × scale / 10 + offset
 */
export function backCalculateVoltage(
  fcDisplayed: number,
  oldScale: number,
  oldOffset: number,
): number {
  return fcDisplayed * oldScale / 10 + oldOffset;
}

/**
 * Perform ordinary least-squares linear regression on a set of (x, y) points.
 * Returns slope, intercept, and R² (coefficient of determination).
 *
 * y = slope * x + intercept
 */
export function linearRegression(points: DataPoint[]): RegressionResult | null {
  const n = points.length;
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }

  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-15) return null; // degenerate case (all x values identical)

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R² calculation
  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (const p of points) {
    const predicted = slope * p.x + intercept;
    ssTot += (p.y - meanY) ** 2;
    ssRes += (p.y - predicted) ** 2;
  }

  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 1;

  return { slope, intercept, rSquared };
}

/**
 * Orchestrate the full calibration calculation.
 *
 * @param measurements - Array of { trueCurrent, fcCurrent } pairs (both in amps)
 * @param oldScale - The FC's current "Current Meter Scale" setting
 * @param oldOffset - The FC's current "Offset" setting (in millivolt steps)
 */
export function calculateCalibration(
  measurements: { trueCurrent: number; fcCurrent: number }[],
  oldScale: number,
  oldOffset: number,
): CalibrationResult | null {
  if (measurements.length < 2) return null;

  // 1. Back-calculate ADC voltage (mV) for each FC reading
  const dataPoints: DataPoint[] = measurements.map((m) => ({
    x: backCalculateVoltage(m.fcCurrent, oldScale, oldOffset),
    y: m.trueCurrent,
  }));

  // 2. Run linear regression: true_current = slope × V_mV + intercept
  const regression = linearRegression(dataPoints);
  if (!regression) return null;
  if (Math.abs(regression.slope) < 1e-15) return null; // slope must be non-zero

  // 3. Derive new firmware parameters
  // From: true_current = (V_mV − new_offset) × 10 / new_scale
  //     = (10/new_scale) × V_mV − (10 × new_offset / new_scale)
  // Matching to: true_current = slope × V_mV + intercept
  //   slope     = 10 / new_scale       → new_scale  = 10 / slope
  //   intercept = −new_offset × slope  → new_offset = −intercept / slope
  const newScale = 10 / regression.slope;
  const newOffset = -regression.intercept / regression.slope;

  // 4. Compute regression line endpoints for chart
  const xValues = dataPoints.map((p) => p.x);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const xRange = xMax - xMin;
  const lineX1 = xMin - xRange * 0.05;
  const lineX2 = xMax + xRange * 0.05;

  // 4. Compute the old calibration line (what the FC was computing with old params)
  // Old formula: true_current_old = (V_mV − oldOffset) × 10 / oldScale
  const oldSlope = 10 / oldScale;
  const oldIntercept = -oldOffset * 10 / oldScale;

  return {
    newScale,
    newOffset,
    rSquared: regression.rSquared,
    slope: regression.slope,
    intercept: regression.intercept,
    dataPoints,
    regressionLine: {
      x1: lineX1,
      y1: regression.slope * lineX1 + regression.intercept,
      x2: lineX2,
      y2: regression.slope * lineX2 + regression.intercept,
    },
    oldCalibrationLine: {
      x1: lineX1,
      y1: oldSlope * lineX1 + oldIntercept,
      x2: lineX2,
      y2: oldSlope * lineX2 + oldIntercept,
    },
  };
}
