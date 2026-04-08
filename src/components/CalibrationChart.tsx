import { useMemo } from 'react';
import { useCalibrationStore } from '@/store/calibrationStore';
import { calculateCalibration } from '@/engine/regression';
import {
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';

interface ChartDataPoint {
  x: number;
  trueCurrent: number | null;  // null for line-only extension points
  newCal: number;
  oldCal: number;
}

// Custom tooltip, only shows when hovering near an actual measurement dot
function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number | null; payload: ChartDataPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload;
  if (!point || point.trueCurrent === null) return null; // Don't show line only points

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
        fontFamily: "'JetBrains Mono', monospace",
        pointerEvents: 'none',
      }}
    >
      <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px', fontSize: '11px' }}>Measurement</div>
      <div style={{ color: 'var(--color-accent-green)', marginBottom: '2px' }}>
        True Current: <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{point.trueCurrent.toFixed(3)} A</span>
      </div>
      <div style={{ color: 'var(--color-accent-red)' }}>
        Old Cal Current: <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{point.oldCal.toFixed(3)} A</span>
      </div>
      <div style={{ color: 'var(--color-accent-blue)', marginBottom: '2px' }}>
        ADC Voltage: <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{point.x.toFixed(2)} mV</span>
      </div>
    </div>
  );
}

export default function CalibrationChart() {
  const { measurements, currentScale, currentOffset } = useCalibrationStore();

  const { hasResult, chartData } = useMemo(() => {
    const scale = parseFloat(currentScale);
    const offset = parseFloat(currentOffset);
    if (isNaN(scale) || scale === 0 || isNaN(offset)) {
      return { hasResult: false, chartData: [] as ChartDataPoint[] };
    }

    const validMeasurements = measurements
      .filter((m) => m.trueCurrent !== '' && m.fcCurrent !== '')
      .map((m) => ({
        trueCurrent: parseFloat(m.trueCurrent),
        fcCurrent: parseFloat(m.fcCurrent),
      }))
      .filter((m) => !isNaN(m.trueCurrent) && !isNaN(m.fcCurrent));

    if (validMeasurements.length < 2) {
      return { hasResult: false, chartData: [] as ChartDataPoint[] };
    }

    const calcResult = calculateCalibration(validMeasurements, scale, offset);
    if (!calcResult) {
      return { hasResult: false, chartData: [] as ChartDataPoint[] };
    }

    // Old calibration line coefficients
    const oldSlope = 10 / scale;
    const oldIntercept = -offset * 10 / scale;

    // Build a unified dataset: each measurement point + extension endpoints for lines
    const data: ChartDataPoint[] = [];

    // Add actual measurement data points
    for (const dp of calcResult.dataPoints) {
      data.push({
        x: parseFloat(dp.x.toFixed(4)),
        trueCurrent: parseFloat(dp.y.toFixed(4)),
        newCal: parseFloat((calcResult.slope * dp.x + calcResult.intercept).toFixed(4)),
        oldCal: parseFloat((oldSlope * dp.x + oldIntercept).toFixed(4)),
      });
    }

    // Add extension points so lines reach from x=0 to beyond the data
    const xMax = Math.max(...calcResult.dataPoints.map((p) => p.x));
    const xExtend = xMax * 1.1;

    // x=0 endpoint
    data.push({
      x: 0,
      trueCurrent: null,
      newCal: parseFloat(calcResult.intercept.toFixed(4)),
      oldCal: parseFloat(oldIntercept.toFixed(4)),
    });

    // x=max+10% endpoint
    data.push({
      x: parseFloat(xExtend.toFixed(4)),
      trueCurrent: null,
      newCal: parseFloat((calcResult.slope * xExtend + calcResult.intercept).toFixed(4)),
      oldCal: parseFloat((oldSlope * xExtend + oldIntercept).toFixed(4)),
    });

    // Sort by x so lines render correctly
    data.sort((a, b) => a.x - b.x);

    return { hasResult: true, chartData: data };
  }, [measurements, currentScale, currentOffset]);

  if (!hasResult) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-blue/10">
            <LineChartIcon className="w-4 h-4 text-accent-blue" />
          </div>
          <h2 className="text-base font-semibold text-text-primary">Fit Visualization</h2>
        </div>
        <div className="flex items-center justify-center h-48 text-sm text-text-muted">
          Add at least 2 complete measurements to see the chart.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-blue/10">
          <LineChartIcon className="w-4 h-4 text-accent-blue" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text-primary">Fit Visualization</h2>
          <p className="text-xs text-text-muted mt-0.5">
            ADC voltage (mV) → Current
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
            <XAxis
              dataKey="x"
              type="number"
              domain={[0, 'auto']}
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
              label={{
                value: 'ADC Voltage (mV)',
                position: 'insideBottom',
                offset: -10,
                fill: 'var(--color-text-muted)',
                fontSize: 11,
              }}
              stroke="var(--color-accent-gray)"
              tickLine={{ stroke: 'var(--color-accent-gray)' }}
            />
            <YAxis
              type="number"
              domain={['auto', 'auto']}
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
              label={{
                value: 'Current (A)',
                angle: -90,
                position: 'insideLeft',
                offset: 5,
                fill: 'var(--color-text-muted)',
                fontSize: 11,
              }}
              stroke="var(--color-accent-gray)"
              tickLine={{ stroke: 'var(--color-accent-gray)' }}
            />
            <RechartsTooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'var(--color-accent-gray)', strokeDasharray: '3 3' }}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ zIndex: 10 }}
            />
            {/* Old calibration line (what the FC was computing) */}
            <Line
              dataKey="oldCal"
              type="linear"
              stroke="var(--color-accent-red)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              dot={false}
              activeDot={false}
              name="Old Cal"
              legendType="none"
              isAnimationActive={false}
              connectNulls
            />
            {/* New calibration / regression line */}
            <Line
              dataKey="newCal"
              type="linear"
              stroke="var(--color-accent-green)"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              activeDot={false}
              name="New Cal"
              legendType="none"
              isAnimationActive={false}
              connectNulls
            />
            {/* Data points (trueCurrent is null for extension points, so no dot renders) */}
            <Scatter
              dataKey="trueCurrent"
              fill="var(--color-accent-yellow)"
              stroke="#ffd566"
              strokeWidth={1}
              name="Measurements"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent-yellow" />
          <span className="text-xs text-text-muted">Measured</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-0 border-t-2 border-dashed border-accent-green" />
          <span className="text-xs text-text-muted">New calibration</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-0 border-t-[1.5px] border-dashed border-accent-red/60" />
          <span className="text-xs text-text-muted">Old calibration</span>
        </div>
      </div>
    </div>
  );
}
