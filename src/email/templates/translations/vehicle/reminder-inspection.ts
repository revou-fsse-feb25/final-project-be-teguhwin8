const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function diffDays(a: Date, b: Date) {
  return Math.ceil((a.getTime() - b.getTime()) / MS_PER_DAY);
}
function fmtDateID(d: Date) {
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
function fmtDateEN(d: Date) {
  return d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function getReminderInspectionTranslations(c: {
  name?: string | null;
  licensePlate?: string | null;
  inspectionExpiryDate: Date;
}) {
  const now = new Date();
  const daysToExpiry = diffDays(c.inspectionExpiryDate, startOfDay(now));
  const remainingDays = Math.max(0, daysToExpiry);
  const overdueDays = Math.max(0, -daysToExpiry);

  let window: 'pre' | 'exact' | 'overdue' = 'pre';
  if (daysToExpiry === 0) window = 'exact';
  if (daysToExpiry < 0) window = 'overdue';

  const idDate = fmtDateID(c.inspectionExpiryDate);
  const enDate = fmtDateEN(c.inspectionExpiryDate);

  const title = {
    id: `[Akan Jatuh Tempo] KIR ${c.licensePlate ?? '-'} pada ${idDate}`,
    en: `[Due Soon] Vehicle Inspection ${c.licensePlate ?? '-'} on ${enDate}`,
  };

  const description = {
    id:
      window === 'overdue'
        ? `Uji KIR untuk unit ${c.name ?? '-'} (${
            c.licensePlate ?? '-'
          }) telah lewat ${overdueDays} hari. Segera lakukan perpanjangan.`
        : window === 'exact'
        ? `Uji KIR untuk unit ${c.name ?? '-'} (${
            c.licensePlate ?? '-'
          }) jatuh tempo hari ini (${idDate}).`
        : `Uji KIR untuk unit ${c.name ?? '-'} (${
            c.licensePlate ?? '-'
          }) akan jatuh tempo pada ${idDate} (H-${remainingDays}).`,
    en:
      window === 'overdue'
        ? `KIR inspection for ${c.name ?? '-'} (${
            c.licensePlate ?? '-'
          }) is overdue by ${overdueDays} day(s). Please renew immediately.`
        : window === 'exact'
        ? `KIR inspection for ${c.name ?? '-'} (${
            c.licensePlate ?? '-'
          }) is due today (${enDate}).`
        : `KIR inspection for ${c.name ?? '-'} (${
            c.licensePlate ?? '-'
          }) will be due on ${enDate} (D-${remainingDays}).`,
  };

  return { title, description, window, remainingDays, overdueDays };
}
