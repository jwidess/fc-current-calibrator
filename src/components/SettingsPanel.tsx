import { useCalibrationStore } from '@/store/calibrationStore';
import { Settings, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import InfoTooltip from '@/components/InfoTooltip';

export default function SettingsPanel() {
  const { currentScale, currentOffset, setCurrentScale, setCurrentOffset, resetAll } =
    useCalibrationStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-blue/10">
            <Settings className="w-4 h-4 text-accent-blue" />
          </div>
          <h2 className="text-base font-semibold text-text-primary">
            Present FC Settings
          </h2>
        </div>
        <div className="relative">
          {showResetConfirm ? (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-xs text-text-secondary">Reset all?</span>
              <button
                id="reset-confirm-btn"
                onClick={() => {
                  resetAll();
                  setShowResetConfirm(false);
                }}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-accent-red/15 text-accent-red 
                           hover:bg-accent-red/25 transition-colors cursor-pointer"
              >
                Yes
              </button>
              <button
                id="reset-cancel-btn"
                onClick={() => setShowResetConfirm(false)}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-bg-input text-text-secondary 
                           hover:text-text-primary transition-colors cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <button
              id="reset-btn"
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md 
                         text-text-muted hover:text-text-secondary hover:bg-bg-input 
                         transition-all cursor-pointer"
              title="Reset all values to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-4 px-3 py-2.5 rounded-lg bg-accent-blue/5 border border-accent-blue/15">
        <p className="text-xs text-text-secondary leading-relaxed">
          Enter the <strong className="text-text-primary">present</strong> calibration values from your flight controller.
          These are needed to back-calculate the raw sensor readings from the FC's displayed current.
          Refer to your specific FC configurator documentation for the location of these values. Or use the CLI commands <code className="font-mono text-accent-cyan">current_meter_scale</code> and <code className="font-mono text-accent-cyan">current_meter_offset</code> to get them.
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Scale */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="current-scale-input"
              className="text-sm font-medium text-text-secondary"
            >
              Current Meter Scale
            </label>
            <InfoTooltip
              label="Show scale help"
              tooltipClassName="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 rounded-lg bg-bg-secondary border border-border text-xs text-text-secondary w-52"
            >
              The multiplier for the raw ADC reading. Default will vary by FC but is often around <strong className="text-text-primary">150-400</strong>.
              In the CLI:{' '}
              <code className="font-mono text-accent-cyan">current_meter_scale</code>
            </InfoTooltip>
          </div>
          <input
            id="current-scale-input"
            type="number"
            value={currentScale}
            onChange={(e) => setCurrentScale(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-text-primary 
                       font-mono text-sm placeholder-text-muted
                       focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue/30
                       transition-all"
            placeholder="400"
          />
        </div>

        {/* Offset */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="current-offset-input"
              className="text-sm font-medium text-text-secondary"
            >
              Offset (mV steps)
            </label>
            <InfoTooltip
              label="Show offset help"
              tooltipClassName="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 rounded-lg bg-bg-secondary border border-border text-xs text-text-secondary w-52"
            >
              The offset added to the scaled reading. Default is <strong className="text-text-primary">0</strong>.
              In the CLI:{' '}
              <code className="font-mono text-accent-cyan">current_meter_offset</code>
            </InfoTooltip>
          </div>
          <input
            id="current-offset-input"
            type="number"
            value={currentOffset}
            onChange={(e) => setCurrentOffset(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-text-primary 
                       font-mono text-sm placeholder-text-muted
                       focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue/30
                       transition-all"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}
