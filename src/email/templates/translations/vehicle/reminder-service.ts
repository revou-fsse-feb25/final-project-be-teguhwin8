const fmtKm = (n: number) => `${Math.round(n).toLocaleString('id-ID')} km`;

export function getReminderServiceTranslations(c: any) {
  const remainingToCurrent = Math.max(0, c.thresholdKm - c.odometerKm);

  const title = {
    id: `[Pre-Reminder] Servis ${c.name ?? '-'} di ${fmtKm(
      c.nextCycleThresholdKm,
    )} (sisa ${fmtKm(c.distanceToNextKm)})`,
    en: `[Pre-Reminder] Service ${c.name ?? '-'} at ${fmtKm(
      c.nextCycleThresholdKm,
    )} (remaining ${fmtKm(c.distanceToNextKm)})`,
  };

  const description = {
    id:
      c.window === 'pre'
        ? `Unit ${c.name ?? '-'} (${
            c.licensePlate ?? '-'
          }) mendekati jadwal servis. Target: ${fmtKm(
            c.thresholdKm,
          )}. Sisa: ${fmtKm(remainingToCurrent)}.`
        : c.window === 'exact'
        ? `Unit ${c.name ?? '-'} (${
            c.licensePlate ?? '-'
          }) telah mencapai ${fmtKm(
            c.thresholdKm,
          )}. Mohon jadwalkan servis segera.`
        : `Unit ${c.name ?? '-'} (${
            c.licensePlate ?? '-'
          }) telah melewati ${fmtKm(
            c.thresholdKm,
          )}. Harap lakukan servis secepatnya.`,

    en:
      c.window === 'pre'
        ? `Vehicle ${c.name ?? '-'} (${
            c.licensePlate ?? '-'
          }) is approaching service. Target: ${fmtKm(
            c.thresholdKm,
          )}. Remaining: ${fmtKm(remainingToCurrent)}.`
        : c.window === 'exact'
        ? `Vehicle ${c.name ?? '-'} (${
            c.licensePlate ?? '-'
          }) has reached ${fmtKm(
            c.thresholdKm,
          )}. Please schedule service promptly.`
        : `Vehicle ${c.name ?? '-'} (${c.licensePlate ?? '-'}) is past ${fmtKm(
            c.thresholdKm,
          )}. Please service it as soon as possible.`,
  };

  return { title, description };
}
