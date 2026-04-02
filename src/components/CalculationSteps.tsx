import { useMemo } from 'react';
import { useCalibrationStore } from '@/store/calibrationStore';
import { calculateCalibration, backCalculateVoltage } from '@/engine/regression';
import { Calculator } from 'lucide-react';

export default function CalculationSteps() {
  const { measurements, currentScale, currentOffset } = useCalibrationStore();

  const data = useMemo(() => {
    const scale = parseFloat(currentScale);
    const offset = parseFloat(currentOffset);
    if (isNaN(scale) || scale === 0 || isNaN(offset)) return null;

    const validMeasurements = measurements
      .filter((m) => m.trueCurrent !== '' && m.fcCurrent !== '')
      .map((m) => ({
        trueCurrent: parseFloat(m.trueCurrent),
        fcCurrent: parseFloat(m.fcCurrent),
      }))
      .filter((m) => !isNaN(m.trueCurrent) && !isNaN(m.fcCurrent));

    if (validMeasurements.length < 2) return null;

    const voltages = validMeasurements.map((m) => ({
      ...m,
      voltage: backCalculateVoltage(m.fcCurrent, scale, offset),
    }));

    const result = calculateCalibration(validMeasurements, scale, offset);
    if (!result) return null;

    return { scale, offset, voltages, result };
  }, [measurements, currentScale, currentOffset]);

  if (!data) {
    return null;
  }

  const { scale, offset, voltages, result } = data;

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-cyan/10">
          <Calculator className="w-4 h-4 text-accent-cyan" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text-primary">Calculation Breakdown</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Live-updating intermediate values
          </p>
        </div>
      </div>

      {/* Step 1: Firmware Formula */}
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-bg-input border border-border">
          <p className="text-xs font-semibold text-accent-blue mb-2">Step 1: Firmware Formula</p>
          <p className="text-xs text-text-secondary mb-1.5">
            The FC computes current as:
          </p>
          <code className="block text-xs font-mono text-accent-cyan bg-bg-primary/50 px-2.5 py-1.5 rounded">
            displayed_A = (V_mV − offset) × 10 / scale
          </code>
        </div>

        {/* Step 2: Back-calculate voltages */}
        <div className="p-3 rounded-lg bg-bg-input border border-border">
          <p className="text-xs font-semibold text-accent-blue mb-2">Step 2: Back-Calculate ADC Voltages</p>
          <p className="text-xs text-text-secondary mb-1.5">
            Using your current settings (scale={scale}, offset={offset}):
          </p>
          <code className="block text-xs font-mono text-accent-cyan bg-bg-primary/50 px-2.5 py-1.5 rounded mb-2">
            V_mV = FC_reading × {scale}/10 + {offset}
          </code>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-text-muted">
                  <th className="text-left py-1 pr-3">#</th>
                  <th className="text-right py-1 px-2">True (A)</th>
                  <th className="text-right py-1 px-2">FC (A)</th>
                  <th className="text-right py-1 px-2">V_mV</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                {voltages.map((v, i) => (
                  <tr key={i} className="border-t border-border/30">
                    <td className="py-1 pr-3 text-text-muted">{i + 1}</td>
                    <td className="text-right py-1 px-2">{v.trueCurrent}</td>
                    <td className="text-right py-1 px-2">{v.fcCurrent}</td>
                    <td className="text-right py-1 px-2 text-accent-cyan">{v.voltage.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Step 3: Regression */}
        <div className="p-3 rounded-lg bg-bg-input border border-border">
          <p className="text-xs font-semibold text-accent-blue mb-2">Step 3: Linear Regression</p>
          <p className="text-xs text-text-secondary mb-1.5">
            Least-squares fit of true_current vs V_mV:
          </p>
          <code className="block text-xs font-mono text-accent-cyan bg-bg-primary/50 px-2.5 py-1.5 rounded mb-2">
            true_current = {result.slope.toFixed(6)} × V_mV + ({result.intercept.toFixed(6)})
          </code>
          <p className="text-xs text-text-muted">
            R² = {result.rSquared.toFixed(6)}
          </p>
        </div>

        {/* Step 4: Derive params */}
        <div className="p-3 rounded-lg bg-bg-input border border-border">
          <p className="text-xs font-semibold text-accent-blue mb-2">Step 4: Derive New Parameters</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-text-secondary">new_scale</code>
              <span className="text-xs text-text-muted">=</span>
              <code className="text-xs font-mono text-text-secondary">10 / {result.slope.toFixed(6)}</code>
              <span className="text-xs text-text-muted">=</span>
              <code className="text-xs font-mono text-accent-green font-semibold">{result.newScale.toFixed(4)}</code>
              <span className="text-xs text-text-muted">≈</span>
              <code className="text-xs font-mono text-accent-green font-bold">{Math.round(result.newScale)}</code>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-text-secondary">new_offset</code>
              <span className="text-xs text-text-muted">=</span>
              <code className="text-xs font-mono text-text-secondary">−({result.intercept.toFixed(6)}) / {result.slope.toFixed(6)}</code>
              <span className="text-xs text-text-muted">=</span>
              <code className="text-xs font-mono text-accent-green font-semibold">{result.newOffset.toFixed(4)}</code>
              <span className="text-xs text-text-muted">≈</span>
              <code className="text-xs font-mono text-accent-green font-bold">{Math.round(result.newOffset)}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
