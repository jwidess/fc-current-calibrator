import { useCalibrationStore } from '@/store/calibrationStore';
import { Plus, Trash2, FlaskConical } from 'lucide-react';

export default function MeasurementTable() {
  const { measurements, addMeasurement, updateMeasurement, removeMeasurement } =
    useCalibrationStore();

  const canDelete = measurements.length > 2;

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-purple/10">
            <FlaskConical className="w-4 h-4 text-accent-purple" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">Measurements</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {measurements.length} data point{measurements.length !== 1 ? 's' : ''} · min 2 required
            </p>
          </div>
        </div>
        <button
          id="add-measurement-btn"
          onClick={addMeasurement}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                     bg-accent-blue/10 text-accent-blue border border-accent-blue/20
                     hover:bg-accent-blue/20 hover:border-accent-blue/30 
                     transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Row
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-xs font-medium text-text-muted uppercase tracking-wide">
              <th className="text-left py-2 px-3 w-12">#</th>
              <th className="text-left py-2 px-3">True Current (A)</th>
              <th className="text-left py-2 px-3">FC Reported (A)</th>
              <th className="text-right py-2 px-3 w-14"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {measurements.map((m, index) => {
              const isComplete = m.trueCurrent !== '' && m.fcCurrent !== '';
              const isEmpty = m.trueCurrent === '' && m.fcCurrent === '';

              return (
                <tr
                  key={m.id}
                  className={`group transition-colors ${
                    isComplete
                      ? 'hover:bg-bg-card-hover'
                      : isEmpty
                        ? 'hover:bg-bg-card-hover'
                        : 'bg-accent-yellow/[0.03] hover:bg-accent-yellow/[0.06]'
                  }`}
                >
                  {/* Row number */}
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-medium
                        ${
                          isComplete
                            ? 'bg-accent-green/10 text-accent-green'
                            : 'bg-bg-input text-text-muted'
                        }`}
                    >
                      {index + 1}
                    </span>
                  </td>

                  {/* True Current */}
                  <td className="py-2 px-3">
                    <input
                      id={`true-current-${index}`}
                      type="number"
                      step="any"
                      value={m.trueCurrent}
                      onChange={(e) =>
                        updateMeasurement(m.id, { trueCurrent: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-md bg-accent-green/5 border border-border text-accent-green
                                 font-mono text-sm placeholder-text-muted
                                 focus:border-accent-green focus:outline-none focus:ring-1 focus:ring-accent-green/30
                                 transition-all"
                      placeholder="0.00"
                    />
                  </td>

                  {/* FC Reported Current */}
                  <td className="py-2 px-3">
                    <input
                      id={`fc-current-${index}`}
                      type="number"
                      step="any"
                      value={m.fcCurrent}
                      onChange={(e) =>
                        updateMeasurement(m.id, { fcCurrent: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-md bg-accent-red/5 border border-border text-accent-red 
                                 font-mono text-sm placeholder-text-muted
                                 focus:border-accent-red focus:outline-none focus:ring-1 focus:ring-accent-red/30
                                 transition-all"
                      placeholder="0.00"
                    />
                  </td>

                  {/* Delete */}
                  <td className="py-2 px-3 text-right">
                    <button
                      id={`delete-measurement-${index}`}
                      tabIndex={-1}
                      onClick={() => removeMeasurement(m.id)}
                      disabled={!canDelete}
                      className={`p-1.5 rounded-md transition-all cursor-pointer
                        ${
                          canDelete
                            ? 'text-text-muted hover:text-accent-red hover:bg-accent-red/10 opacity-0 group-hover:opacity-100'
                            : 'text-border cursor-not-allowed opacity-30'
                        }`}
                      title={canDelete ? 'Remove measurement' : 'Minimum 2 measurements required'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer tip */}
      <div className="mt-3 px-3">
        <p className="text-[11px] text-text-muted">
          💡 Add measurements at different current levels for a better fit. More data points = more accurate calibration.
        </p>
      </div>
    </div>
  );
}
