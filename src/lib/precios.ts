export function esHoraPico(
  hora: string,
  fecha: string,
  horasPico: string,
  diasPico: string
): boolean {
  if (!horasPico || !diasPico) return false

  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const [year, month, day] = fecha.split('-').map(Number)
  const diaNombre = DIAS[new Date(year, month - 1, day).getDay()]

  const diasPicoLower = diasPico.split(',').map(d => d.trim().toLowerCase()).filter(Boolean)
  console.log('[precios] fecha:', fecha, 'dia semana:', diaNombre)
  console.log('[precios] diasPico array:', diasPicoLower)
  console.log('[precios] dia incluido:', diasPicoLower.includes(diaNombre))
  if (!diasPicoLower.includes(diaNombre)) return false

  const rangos = horasPico.split(',').map(r => r.trim()).filter(Boolean)
  console.log('[precios] hora:', hora, 'rangos:', rangos)
  for (const rango of rangos) {
    const parts = rango.split('-')
    if (parts.length < 2) continue
    const inicio = parts[0].trim()
    const fin = parts[1].trim()
    if (hora >= inicio && hora < fin) return true
  }

  return false
}

export function calcularPrecio(
  horaInicio: string,
  fecha: string,
  duracionMinutos: number,
  precioNormal: number,
  precioPico: number | undefined,
  horasPico: string,
  diasPico: string
): number {
  const pico = precioPico && precioPico > 0
    ? esHoraPico(horaInicio, fecha, horasPico, diasPico)
    : false
  const tarifa = pico ? precioPico! : precioNormal
  return Math.round(tarifa * (duracionMinutos / 60) * 100) / 100
}
