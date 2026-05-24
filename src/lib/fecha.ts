export function fechaHoyMexico(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
  }).format(new Date());
}

export function horaActualMexico(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Mexico_City',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date());
  const hour = parts.find(p => p.type === 'hour')?.value ?? '00';
  const minute = parts.find(p => p.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
}

export function formatearFechaLegible(fecha: string): string {
  const solo = fecha.slice(0, 10);
  const [year, month, day] = solo.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  }).format(date);
}

export function esReservaPasadaSinCompletar(
  fecha: string,
  hora_fin: string,
  estado: string,
  fechaHoy: string,
  horaActual: string
): boolean {
  if (estado !== 'Confirmada') return false;
  if (fecha < fechaHoy) return true;
  if (fecha === fechaHoy && hora_fin <= horaActual) return true;
  return false;
}
