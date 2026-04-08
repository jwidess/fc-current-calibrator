import SettingsPanel from '@/components/SettingsPanel';
import MeasurementTable from '@/components/MeasurementTable';
import ResultsPanel from '@/components/ResultsPanel';
import CalibrationChart from '@/components/CalibrationChart';
import CalculationSteps from '@/components/CalculationSteps';
import DataExport from '@/components/DataExport';
import HelpSection from '@/components/HelpSection';
import { Zap, Github } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Background gradient effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[860px] h-[420px] bg-gradient-to-b from-accent-blue/[0.06] to-transparent rounded-full blur-3xl" />
        <div className="absolute -top-10 right-[8%] w-[420px] h-[260px] bg-gradient-to-b from-accent-yellow/[0.07] to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8">
        {/* ── Header ── */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-yellow/20 border border-accent-blue/25 mb-4">
            <Zap className="w-7 h-7 text-accent-blue" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
            <span className="bg-gradient-to-r from-accent-blue to-accent-yellow bg-clip-text text-transparent">
              FC Current Sensor
            </span>{' '}
            Calibrator
          </h1>
          <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
            Calibrate your flight controller's current sensor by comparing real measurements
            with your FC readings. Works with{' '}
            <span className="text-accent-yellow font-semibold">Betaflight</span>,{' '}
            <span className="text-accent-blue font-semibold">iNav</span>, and other firmware
            using scale/offset calibration.
          </p>
        </header>

        {/* ── Main Content ── */}
        <main className="space-y-5">
          {/* Settings */}
          <SettingsPanel />

          {/* Measurements + Export/Import */}
          <MeasurementTable />
          <div className="flex items-center justify-end -mt-2">
            <DataExport />
          </div>

          {/* Results + Chart grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ResultsPanel />
            <CalibrationChart />
          </div>

          {/* Calculation Breakdown */}
          <CalculationSteps />

          {/* Help */}
          <HelpSection />
        </main>

        {/* ── Footer ── */}
        <footer className="mt-12 pt-6 border-t border-border text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-text-muted">
            <a
              href="https://github.com/jwidess/fc-current-calibrator"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-text-secondary transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              Source Code
            </a>
            <span className="text-border">·</span>
            <span>
              All calculations run locally in your browser. No data is sent anywhere.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
