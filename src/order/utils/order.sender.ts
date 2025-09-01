const TZ = 'Asia/Jakarta';

export function capitalizeWords(s?: string | null) {
  if (!s) return '';
  return s
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

export function formatDateID(dateISO: string | Date) {
  const d = typeof dateISO === 'string' ? new Date(dateISO) : dateISO;
  return d.toLocaleDateString('id-ID', {
    timeZone: TZ,
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function buildRouteLabel(trip: any) {
  const from = capitalizeWords(trip?.departureCity ?? trip?.departureName);
  const to = capitalizeWords(trip?.arivalCity ?? trip?.arivalName);
  return `${from} → ${to}`.trim();
}

// seat: { code:number, row:number, column:number }
export function getSeatLabel(seat: any, fallbackId?: string | null) {
  if (!seat)
    return fallbackId
      ? `Seat ${String(fallbackId).slice(0, 4).toUpperCase()}`
      : null;
  const rc =
    seat.row != null && seat.column != null
      ? ` (R${seat.row}C${seat.column})`
      : '';
  return (seat.code != null ? `Seat ${seat.code}` : '').concat(rc);
}

export function buildVehicleLabel(trip: any) {
  const bits = [trip?.vehicleName, trip?.vehicleLicense].filter(Boolean);
  return bits.length ? bits.join(' • ') : null;
}

export function buildDepartureTimeLabel(trip: any) {
  const t = (trip?.departureTime || '').toString().trim();
  return t ? `${t} WIB` : null; // ex: "11:00 WIB"
}
