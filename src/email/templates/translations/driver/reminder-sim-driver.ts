const fmtDateID = (d: Date) =>
  d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

const fmtDateEN = (d: Date) =>
  d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

export function getReminderSimDriverTranslations(input: any) {
  const name = (input.name ?? '').trim() || '-';
  const simNumber = (input.simNumber ?? '').trim() || '-';
  const date =
    input.simExpiryDate instanceof Date
      ? input.simExpiryDate
      : new Date(input.simExpiryDate as any);
  const idDate = fmtDateID(date);
  const enDate = fmtDateEN(date);
  const title = {
    id: `[Akan Jatuh Tempo] SIM ${name} berlaku hingga ${idDate}`,
    en: `[Due Soon] Driver’s License for ${name} valid until ${enDate}`,
  };
  const description = {
    id: `SIM ${simNumber} atas nama ${name} berlaku hingga ${idDate}. Mohon lakukan perpanjangan sebelum tanggal tersebut.`,
    en: `Driver’s license ${simNumber} for ${name} is valid until ${enDate}. Please renew before that date.`,
  };
  return { title, description };
}
