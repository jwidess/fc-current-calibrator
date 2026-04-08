import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';

export default function HelpSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-bg-card animate-fade-in">
      {/* Toggle header */}
      <button
        id="help-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-bg-card-hover transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-yellow/10">
            <HelpCircle className="w-4 h-4 text-accent-yellow" />
          </div>
          <h2 className="text-base font-semibold text-text-primary">
            How to Calibrate
          </h2>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-5 pb-5 animate-slide-down">
          <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
            {/* What you need */}
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">
                What You Need
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>
                  A <strong className="text-text-primary">benchtop power supply</strong> with current readout,
                  or an <strong className="text-text-primary">inline current meter / clamp meter</strong>
                </li>
                <li>
                  An <strong className="text-text-primary">adjustable / programmable load</strong>,
                  or just use a motor and ESC at different throttle levels
                </li>
                <li>
                  Your FC's <strong className="text-text-primary">present calibration values</strong> (Scale & Offset)
                  from your configurator
                </li>
              </ul>
            </div>

            {/* Steps */}
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">
                Step-by-Step Process
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs">
                <li>
                  <strong className="text-text-primary">Get your present FC settings</strong> — Open your configurator
                  and note your present{' '}
                  <code className="font-mono text-accent-cyan">Current Meter Scale</code> and{' '}
                  <code className="font-mono text-accent-cyan">Offset</code> values.
                  Enter them in the "Present FC Settings" section above.
                </li>
                <li>
                  <strong className="text-text-primary">Set a known current draw</strong> — Use your adjustable load (or set a throttle level)
                  and read the <em>actual</em> current from your benchtop PSU or inline meter.
                </li>
                <li>
                  <strong className="text-text-primary">Record what the FC reports</strong> — At the same time, note what your flight controller reports
                  as the current draw (visible in your configurator, OSD, or telemetry).
                </li>
                <li>
                  <strong className="text-text-primary">Enter both values</strong> — Put the true current and FC reported current
                  in a measurement row.
                </li>
                <li>
                  <strong className="text-text-primary">Repeat at different levels</strong> — Change the load/throttle and repeat.
                  More data points = better calibration. Try to cover your typical range
                  (e.g., idle, cruise, full throttle).
                </li>
                <li>
                  <strong className="text-text-primary">Apply the results</strong> — Enter the computed new Scale and Offset
                  into your FC configurator and save.
                </li>
              </ol>
            </div>

            {/* Tips */}
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">
                Tips for Best Results
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>
                  Include a <strong className="text-text-primary">low current point</strong> (near idle / 0A) and a{' '}
                  <strong className="text-text-primary">high current point</strong> (near max expected draw)
                </li>
                <li>
                  3-5 data points across the range is usually sufficient for a good fit
                </li>
                <li>
                  An R² ≥ 0.99 indicates an excellent fit. Below 0.95, your measurements
                  may have significant error — double-check and re-measure
                </li>
                <li>
                  If your FC already reads fairly accurately, the new Scale will be close to the old one
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
