import { useMemo, useState } from 'react';
import { useCalibrationStore } from '@/store/calibrationStore';
import { calculateCalibration } from '@/engine/regression';
import { Target, Copy, Check, AlertTriangle, HelpCircle } from 'lucide-react';

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
  const cliCommands = `set current_meter_scale = ${roundedScale}\nset current_meter_offset = ${roundedOffset}\nsave`;

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
            <div className="relative group">
              <HelpCircle className="w-3 h-3 text-text-muted cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-bg-primary border border-border text-xs text-text-secondary w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg">
                R² (coefficient of determination) measures how well the regression line fits your data. 1.0 = perfect fit.
                Values ≥ 0.99 are excellent, ≥ 0.95 are good, below 0.95 suggests measurement errors.
              </div>
            </div>
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

      {/* CLI commands code block */}
      <div className="mt-4 relative">
        <p className="text-xs text-text-muted mb-2">
          Paste into your FC's CLI:
        </p>
        <div className="relative group">
          <pre className="text-xs font-mono text-accent-cyan bg-bg-primary/80 border border-border rounded-lg px-3.5 py-2.5 leading-relaxed overflow-x-auto">
{`set current_meter_scale = ${roundedScale}
set current_meter_offset = ${roundedOffset}
save`}
          </pre>
          <button
            id="copy-cli-btn"
            onClick={() => handleCopy(cliCommands, 'cli')}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-bg-card/80 hover:bg-bg-card border border-border/50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
            title="Copy CLI commands"
          >
            {copiedField === 'cli' ? (
              <Check className="w-3.5 h-3.5 text-accent-green" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-text-muted" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
