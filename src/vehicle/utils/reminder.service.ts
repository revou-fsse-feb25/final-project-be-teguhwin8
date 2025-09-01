export type ReminderWindow = 'pre' | 'exact' | 'overdue';

export type VehicleNotifyCandidate = {
  id: string;
  name: string | null;
  licensePlate: string | null;
  odometerKm: number;
  serviceReminderIntervalKm: number;
  window: ReminderWindow;
  cycleIndex: number;
  remainderKm: number;
  thresholdKm: number;
  windowStartKm: number;
  nextPreStartKm: number;
  distanceToNextKm: number;
  nextCycleIndex: number;
  nextCycleThresholdKm: number;
  nextCyclePreStartKm: number;
};

export function shouldNotifyByOdometer(
  odometerKm: number,
  intervalKm: number,
  toleranceKm = 1000,
): Omit<VehicleNotifyCandidate, 'id' | 'name' | 'licensePlate'> | null {
  if (!intervalKm || intervalKm <= 0) return null;
  if (odometerKm == null || isNaN(odometerKm) || odometerKm < 0) return null;

  const I = intervalKm;
  const r = odometerKm % I;
  const m = Math.floor(odometerKm / I);

  const Tc = m === 0 ? I : m * I;
  const Tn = (m + 1) * I;

  const build = (activeThreshold: number) => {
    const cycleIndex = activeThreshold / I;
    const nextCycleThresholdKm = (cycleIndex + 1) * I;
    const nextCyclePreStartKm = nextCycleThresholdKm - toleranceKm;
    const distanceToNextKm = Math.max(0, nextCycleThresholdKm - odometerKm);
    const windowStartKm = activeThreshold - toleranceKm;

    let window: ReminderWindow | null = null;
    if (odometerKm >= windowStartKm && odometerKm < activeThreshold)
      window = 'pre';
    else if (odometerKm === activeThreshold) window = 'exact';
    else if (odometerKm > activeThreshold && odometerKm < nextCyclePreStartKm)
      window = 'overdue';

    if (!window) return null;

    return {
      odometerKm,
      serviceReminderIntervalKm: I,
      window,
      cycleIndex,
      remainderKm: r,
      thresholdKm: activeThreshold,
      windowStartKm,
      nextPreStartKm: nextCyclePreStartKm,
      distanceToNextKm,
      nextCycleIndex: cycleIndex + 1,
      nextCycleThresholdKm,
      nextCyclePreStartKm,
    };
  };

  const curr = build(Tc);
  if (curr) return curr;
  const next = build(Tn);
  if (next) return next;
  return null;
}
