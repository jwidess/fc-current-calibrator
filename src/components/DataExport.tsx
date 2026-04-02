import { useRef, useMemo, useState } from 'react';
import { useCalibrationStore } from '@/store/calibrationStore';
import { calculateCalibration, backCalculateVoltage } from '@/engine/regression';
import { Download, Upload, Check, AlertCircle } from 'lucide-react';

export default function DataExport() {
  const {
    measurements,
    currentScale,
    currentOffset,
    setCurrentScale,
    setCurrentOffset,
    resetAll,
  } = useCalibrationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const result = useMemo(() => {
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

    return calculateCalibration(validMeasurements, parseFloat(currentScale), parseFloat(currentOffset));
  }, [measurements, currentScale, currentOffset]);

  const handleExport = () => {
    const scale = parseFloat(currentScale);
    const offset = parseFloat(currentOffset);
    const lines: string[] = [];

    // Header comment with settings
    lines.push('# FC Current Sensor Calibrator - Export');
    lines.push(`# Current Meter Scale: ${currentScale}`);
    lines.push(`# Offset (mV steps): ${currentOffset}`);
    lines.push('#');

    // Results if available
    if (result) {
      lines.push(`# --- Results ---`);
      lines.push(`# New Current Meter Scale: ${Math.round(result.newScale)} (${result.newScale.toFixed(4)})`);
      lines.push(`# New Offset (mV steps): ${Math.round(result.newOffset)} (${result.newOffset.toFixed(4)})`);
      lines.push(`# R²: ${result.rSquared.toFixed(6)}`);
      lines.push(`# Regression: true_current = ${result.slope.toFixed(6)} × V_mV + (${result.intercept.toFixed(6)})`);
      lines.push('#');
    }

    // CSV header
    lines.push('Row,True Current (A),FC Reported (A),V_mV (back-calculated)');

    // Data rows
    measurements.forEach((m, i) => {
      const trueCurrent = m.trueCurrent || '';
      const fcCurrent = m.fcCurrent || '';
      let voltage = '';

      if (trueCurrent !== '' && fcCurrent !== '' && !isNaN(scale) && scale !== 0 && !isNaN(offset)) {
        const fc = parseFloat(fcCurrent);
        if (!isNaN(fc)) {
          voltage = backCalculateVoltage(fc, scale, offset).toFixed(4);
        }
      }

      lines.push(`${i + 1},${trueCurrent},${fcCurrent},${voltage}`);
    });

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fc-calibration-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/);

        // Parse settings from comments
        let parsedScale: string | null = null;
        let parsedOffset: string | null = null;
        const dataRows: { trueCurrent: string; fcCurrent: string }[] = [];

        let headerFound = false;

        for (const line of lines) {
          const trimmed = line.trim();

          // Parse comment lines for settings
          if (trimmed.startsWith('#')) {
            const scaleMatch = trimmed.match(/Current Meter Scale:\s*([\d.]+)/);
            if (scaleMatch?.[1]) parsedScale = scaleMatch[1];

            const offsetMatch = trimmed.match(/Offset \(mV steps\):\s*([\d.-]+)/);
            if (offsetMatch?.[1]) parsedOffset = offsetMatch[1];
            continue;
          }

          // Skip empty lines
          if (!trimmed) continue;

          // Check for CSV header
          if (trimmed.toLowerCase().startsWith('row,') || trimmed.toLowerCase().startsWith('#')) {
            headerFound = true;
            continue;
          }

          // Parse data rows (Row,TrueCurrent,FCReported,...)
          if (headerFound || /^\d+,/.test(trimmed)) {
            headerFound = true;
            const parts = trimmed.split(',');
            if (parts.length >= 3) {
              const trueCurrent = parts[1]?.trim() ?? '';
              const fcCurrent = parts[2]?.trim() ?? '';
              dataRows.push({ trueCurrent, fcCurrent });
            }
          }
        }

        if (dataRows.length === 0) {
          setImportStatus({ type: 'error', message: 'No data rows found in the CSV file.' });
          setTimeout(() => setImportStatus(null), 4000);
          return;
        }

        // Apply the imported data
        resetAll();

        // Set scale and offset if found
        if (parsedScale) setCurrentScale(parsedScale);
        if (parsedOffset) setCurrentOffset(parsedOffset);

        // We need to wait a tick for reset to apply, then set measurements
        // Use the store's functions directly
        setTimeout(() => {
          const state = useCalibrationStore.getState();

          // Remove default rows first
          for (const m of state.measurements) {
            useCalibrationStore.getState().removeMeasurement(m.id);
          }

          // Add imported rows
          for (const row of dataRows) {
            useCalibrationStore.getState().addMeasurement();
            const currentMeasurements = useCalibrationStore.getState().measurements;
            const lastMeasurement = currentMeasurements[currentMeasurements.length - 1];
            if (lastMeasurement) {
              useCalibrationStore.getState().updateMeasurement(lastMeasurement.id, {
                trueCurrent: row.trueCurrent,
                fcCurrent: row.fcCurrent,
              });
            }
          }

          setImportStatus({ type: 'success', message: `Imported ${dataRows.length} measurements.` });
          setTimeout(() => setImportStatus(null), 3000);
        }, 50);
      } catch {
        setImportStatus({ type: 'error', message: 'Failed to parse the CSV file.' });
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);

    // Reset input so the same file can be re-imported
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Export */}
      <button
        id="export-csv-btn"
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                   bg-accent-green/10 text-accent-green border border-accent-green/20
                   hover:bg-accent-green/20 hover:border-accent-green/30
                   transition-all cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        Export CSV
      </button>

      {/* Import */}
      <button
        id="import-csv-btn"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                   bg-accent-purple/10 text-accent-purple border border-accent-purple/20
                   hover:bg-accent-purple/20 hover:border-accent-purple/30
                   transition-all cursor-pointer"
      >
        <Upload className="w-3.5 h-3.5" />
        Import CSV
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        onChange={handleImport}
        className="hidden"
      />

      {/* Status message */}
      {importStatus && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md animate-fade-in ${
            importStatus.type === 'success'
              ? 'bg-accent-green/10 text-accent-green'
              : 'bg-accent-red/10 text-accent-red'
          }`}
        >
          {importStatus.type === 'success' ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          {importStatus.message}
        </div>
      )}
    </div>
  );
}
