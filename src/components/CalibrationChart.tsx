import { useMemo } from 'react';
import { useCalibrationStore } from '@/store/calibrationStore';
import { calculateCalibration } from '@/engine/regression';
import {
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';

export default function CalibrationChart() {
  const { measurements, currentScale, currentOffset } = useCalibrationStore();

  const { result, scatterData, newLineData, oldLineData } = useMemo(() => {
    const scale = parseFloat(currentScale);
    const offset = parseFloat(currentOffset);
    if (isNaN(scale) || scale === 0 || isNaN(offset)) {
      return { result: null, scatterData: [], newLineData: [], oldLineData: [] };
    }

    const validMeasurements = measurements
      .filter((m) => m.trueCurrent !== '' && m.fcCurrent !== '')
      .map((m) => ({
        trueCurrent: parseFloat(m.trueCurrent),
        fcCurrent: parseFloat(m.fcCurrent),
      }))
      .filter((m) => !isNaN(m.trueCurrent) && !isNaN(m.fcCurrent));

    if (validMeasurements.length < 2) {
      return { result: null, scatterData: [], newLineData: [], oldLineData: [] };
    }

    const calcResult = calculateCalibration(validMeasurements, scale, offset);
    if (!calcResult) {
      return { result: null, scatterData: [], newLineData: [], oldLineData: [] };
    }

    const scatter = calcResult.dataPoints.map((p) => ({
      x: parseFloat(p.x.toFixed(4)),
      y: parseFloat(p.y.toFixed(4)),
    }));

    const newLine = [
      {
        x: parseFloat(calcResult.regressionLine.x1.toFixed(4)),
        y: parseFloat(calcResult.regressionLine.y1.toFixed(4)),
      },
      {
        x: parseFloat(calcResult.regressionLine.x2.toFixed(4)),
        y: parseFloat(calcResult.regressionLine.y2.toFixed(4)),
      },
    ];

    const oldLine = [
      {
        x: parseFloat(calcResult.oldCalibrationLine.x1.toFixed(4)),
        y: parseFloat(calcResult.oldCalibrationLine.y1.toFixed(4)),
      },
      {
        x: parseFloat(calcResult.oldCalibrationLine.x2.toFixed(4)),
        y: parseFloat(calcResult.oldCalibrationLine.y2.toFixed(4)),
      },
    ];

    return { result: calcResult, scatterData: scatter, newLineData: newLine, oldLineData: oldLine };
  }, [measurements, currentScale, currentOffset]);

  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-green/10">
            <LineChartIcon className="w-4 h-4 text-accent-green" />
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
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-green/10">
          <LineChartIcon className="w-4 h-4 text-accent-green" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text-primary">Fit Visualization</h2>
          <p className="text-xs text-text-muted mt-0.5">
            ADC voltage (mV) → True current
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3654" strokeOpacity={0.5} />
            <XAxis
              dataKey="x"
              type="number"
              domain={['auto', 'auto']}
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
              label={{
                value: 'ADC Voltage (mV)',
                position: 'insideBottom',
                offset: -10,
                fill: '#64748b',
                fontSize: 11,
              }}
              stroke="#2a3654"
            />
            <YAxis
              dataKey="y"
              type="number"
              domain={['auto', 'auto']}
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
              label={{
                value: 'Current (A)',
                angle: -90,
                position: 'insideLeft',
                offset: 5,
                fill: '#64748b',
                fontSize: 11,
              }}
              stroke="#2a3654"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a2236',
                border: '1px solid #2a3654',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#f1f5f9',
              }}
              formatter={(value, name) => {
                if (name === 'y') return [`${value} A`, 'True Current'];
                return [value, 'V (mV)'];
              }}
              labelFormatter={(label) => `V: ${label} mV`}
            />
            {/* Old calibration line (what FC was computing) */}
            <Line
              data={oldLineData}
              dataKey="y"
              type="linear"
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              dot={false}
              name="Old Cal"
              legendType="none"
            />
            {/* New calibration / regression line */}
            <Line
              data={newLineData}
              dataKey="y"
              type="linear"
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              name="New Cal"
              legendType="none"
            />
            {/* Data points */}
            <Scatter
              data={scatterData}
              fill="#3b82f6"
              stroke="#60a5fa"
              strokeWidth={1}
              r={5}
              name="Measurements"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent-blue" />
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
