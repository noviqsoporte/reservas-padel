export function normalizarTelefono(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}
