import { useMemo, useState } from 'react';
import { useCalibrationStore } from '@/store/calibrationStore';
import { calculateCalibration } from '@/engine/regression';
import { Target, Copy, Check, AlertTriangle } from 'lucide-react';

export default function ResultsPanel() {
  const { measurements, currentScale, currentOffset } = useCalibrationStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const result = useMemo(() => {
    const scale = parseFloat(currentScale);
    const offset = parseFloat(currentOffset);
    if (isNaN(scale) || scale === 0) return null;
    if (isNaN(offset)) return null;

    // Filter to only complete measurements
    const validMeasurements = measurements
      .filter((m) => m.trueCurrent !== '' && m.fcCurrent !== '')
      .map((m) => ({
        trueCurrent: parseFloat(m.trueCurrent),
        fcCurrent: parseFloat(m.fcCurrent),
      }))
      .filter((m) => !isNaN(m.trueCurrent) && !isNaN(m.fcCurrent));

    if (validMeasurements.length < 2) return null;

    return calculateCalibration(validMeasurements, scale, offset);
  }, [measurements, currentScale, currentOffset]);

  const validCount = measurements.filter(
    (m) => m.trueCurrent !== '' && m.fcCurrent !== '',
  ).length;

  const handleCopy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const getRSquaredColor = (r2: number) => {
    if (r2 >= 0.999) return 'text-accent-green';
    if (r2 >= 0.99) return 'text-accent-green';
    if (r2 >= 0.95) return 'text-accent-yellow';
    return 'text-accent-red';
  };

  const getRSquaredLabel = (r2: number) => {
    if (r2 >= 0.999) return 'Excellent';
    if (r2 >= 0.99) return 'Great';
    if (r2 >= 0.95) return 'Good';
    if (r2 >= 0.90) return 'Fair';
    return 'Poor';
  };

  const getRSquaredDot = (r2: number) => {
    if (r2 >= 0.99) return 'bg-accent-green';
    if (r2 >= 0.95) return 'bg-accent-yellow';
    return 'bg-accent-red';
  };

  // Not enough data
  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-cyan/10">
            <Target className="w-4 h-4 text-accent-cyan" />
          </div>
          <h2 className="text-base font-semibold text-text-primary">Results</h2>
        </div>

        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-bg-input mb-3">
            <AlertTriangle className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-sm text-text-secondary mb-1">Not enough data</p>
          <p className="text-xs text-text-muted max-w-[280px]">
            Complete at least 2 measurement rows with both True Current and FC Reported values.
            Currently: {validCount} of 2 minimum.
          </p>
        </div>
      </div>
    );
  }

  const roundedScale = Math.round(result.newScale);
  const roundedOffset = Math.round(result.newOffset);

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 animate-pulse-glow">
          <Target className="w-4 h-4 text-accent-cyan" />
        </div>
        <h2 className="text-base font-semibold text-text-primary">Results</h2>
      </div>

      {/* Main results */}
      <div className="space-y-3 mb-5">
        {/* New Scale */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-bg-input border border-border">
          <div>
            <p className="text-xs text-text-muted mb-0.5">New Current Meter Scale</p>
            <div className="flex items-baseline gap-2">
              <span
                id="result-scale"
                className="text-2xl font-bold font-mono bg-gradient-to-r from-accent-blue to-accent-cyan bg-clip-text text-transparent"
              >
                {roundedScale}
              </span>
              <span className="text-xs text-text-muted font-mono">
                ({result.newScale.toFixed(4)})
              </span>
            </div>
          </div>
          <button
            id="copy-scale-btn"
            onClick={() => handleCopy(roundedScale.toString(), 'scale')}
            className="p-2 rounded-md hover:bg-bg-card transition-colors cursor-pointer"
            title="Copy to clipboard"
          >
            {copiedField === 'scale' ? (
              <Check className="w-4 h-4 text-accent-green" />
            ) : (
              <Copy className="w-4 h-4 text-text-muted" />
            )}
          </button>
        </div>

        {/* New Offset */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-bg-input border border-border">
          <div>
            <p className="text-xs text-text-muted mb-0.5">New Offset (mV steps)</p>
            <div className="flex items-baseline gap-2">
              <span
                id="result-offset"
                className="text-2xl font-bold font-mono bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent"
              >
                {roundedOffset}
              </span>
              <span className="text-xs text-text-muted font-mono">
                ({result.newOffset.toFixed(4)})
              </span>
            </div>
          </div>
          <button
            id="copy-offset-btn"
            onClick={() => handleCopy(roundedOffset.toString(), 'offset')}
            className="p-2 rounded-md hover:bg-bg-card transition-colors cursor-pointer"
            title="Copy to clipboard"
          >
            {copiedField === 'offset' ? (
              <Check className="w-4 h-4 text-accent-green" />
            ) : (
              <Copy className="w-4 h-4 text-text-muted" />
            )}
          </button>
        </div>
      </div>

      {/* R² indicator */}
      <div className="p-3 rounded-lg bg-bg-input border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getRSquaredDot(result.rSquared)}`} />
            <span className="text-xs text-text-muted">Fit Quality (R²)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono font-semibold ${getRSquaredColor(result.rSquared)}`}>
              {result.rSquared.toFixed(6)}
            </span>
            <span className={`text-xs font-medium ${getRSquaredColor(result.rSquared)}`}>
              {getRSquaredLabel(result.rSquared)}
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 px-3 py-2.5 rounded-lg bg-accent-green/5 border border-accent-green/15">
        <p className="text-xs text-text-secondary leading-relaxed">
          Enter these values in your configurator:{' '}
          <span className="font-mono text-accent-cyan text-[11px]">
            Power & Battery → Current Meter
          </span>
          , or via CLI:{' '}
          <code className="font-mono text-accent-cyan text-[11px]">
            set current_meter_scale = {roundedScale}
          </code>{' '}
          and{' '}
          <code className="font-mono text-accent-cyan text-[11px]">
            set current_meter_offset = {roundedOffset}
          </code>
          . Don't forget to{' '}
          <code className="font-mono text-accent-yellow text-[11px]">save</code>!
        </p>
      </div>
    </div>
  );
}
