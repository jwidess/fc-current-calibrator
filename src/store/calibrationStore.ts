import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '@/lib/utils';

// ── Types ──

export interface Measurement {
  id: string;
  trueCurrent: string;  // string to preserve user input (e.g. empty field vs 0)
  fcCurrent: string;
}

interface CalibrationState {
  /** FC's current "Current Meter Scale" value (default: 400 for Betaflight) */
  currentScale: string;
  /** FC's current "Offset" value in millivolt steps (default: 0) */
  currentOffset: string;

  /** Array of measurement data points */
  measurements: Measurement[];
}

interface CalibrationActions {
  setCurrentScale: (value: string) => void;
  setCurrentOffset: (value: string) => void;

  addMeasurement: () => void;
  updateMeasurement: (id: string, data: Partial<Omit<Measurement, 'id'>>) => void;
  removeMeasurement: (id: string) => void;
  reorderMeasurements: (activeId: string, overId: string) => void;
  replaceMeasurements: (rows: Array<Omit<Measurement, 'id'>>) => void;

  resetAll: () => void;
}

type CalibrationStore = CalibrationState & CalibrationActions;

const defaultState: CalibrationState = {
  currentScale: '400',
  currentOffset: '0',
  measurements: [
    { id: generateId(), trueCurrent: '', fcCurrent: '' },
    { id: generateId(), trueCurrent: '', fcCurrent: '' },
  ],
};

export const useCalibrationStore = create<CalibrationStore>()(
  persist(
    (set) => ({
      ...defaultState,

      setCurrentScale: (value) => set({ currentScale: value }),
      setCurrentOffset: (value) => set({ currentOffset: value }),

      addMeasurement: () =>
        set((state) => ({
          measurements: [
            ...state.measurements,
            { id: generateId(), trueCurrent: '', fcCurrent: '' },
          ],
        })),

      updateMeasurement: (id, data) =>
        set((state) => ({
          measurements: state.measurements.map((m) =>
            m.id === id ? { ...m, ...data } : m,
          ),
        })),

      removeMeasurement: (id) =>
        set((state) => ({
          measurements: state.measurements.filter((m) => m.id !== id),
        })),

      reorderMeasurements: (activeId, overId) =>
        set((state) => {
          const oldIndex = state.measurements.findIndex((m) => m.id === activeId);
          const newIndex = state.measurements.findIndex((m) => m.id === overId);

          if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
            return { measurements: state.measurements };
          }

          const reordered = [...state.measurements];
          const [moved] = reordered.splice(oldIndex, 1);

          if (!moved) {
            return { measurements: state.measurements };
          }

          reordered.splice(newIndex, 0, moved);
          return { measurements: reordered };
        }),

      replaceMeasurements: (rows) =>
        set(() => ({
          measurements: rows.length > 0
            ? rows.map((row) => ({
                id: generateId(),
                trueCurrent: row.trueCurrent,
                fcCurrent: row.fcCurrent,
              }))
            : [
                { id: generateId(), trueCurrent: '', fcCurrent: '' },
                { id: generateId(), trueCurrent: '', fcCurrent: '' },
              ],
        })),

      resetAll: () => set({
        ...defaultState,
        // Generate fresh IDs on reset
        measurements: [
          { id: generateId(), trueCurrent: '', fcCurrent: '' },
          { id: generateId(), trueCurrent: '', fcCurrent: '' },
        ],
      }),
    }),
    {
      name: 'fc-calibration-data',
    },
  ),
);
