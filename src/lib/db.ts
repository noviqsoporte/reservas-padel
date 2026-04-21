import { serviceClient } from './supabase/service'
import { Cancha, Reserva, Bloqueo, Config } from '../types'

// ─── Config ──────────────────────────────────────────────────────────────────

export async function getConfig(): Promise<Config> {
  const { data, error } = await serviceClient
    .from('config')
    .select('*')
    .limit(1)
    .single()

  if (error || !data) {
    return {
      negocio_nombre: '',
      horario_apertura: '',
      horario_cierre: '',
      dias_operacion: [],
      direccion: '',
      telefono: '',
      instagram: '',
    }
  }

  const diasStr = (data.dias_operacion as string) || ''
  return {
    negocio_nombre: data.negocio_nombre || '',
    horario_apertura: data.horario_apertura || '',
    horario_cierre: data.horario_cierre || '',
    dias_operacion: diasStr ? diasStr.split(',').map((d: string) => d.trim()).filter(Boolean) : [],
    direccion: data.direccion || '',
    telefono: data.telefono || '',
    instagram: data.instagram || '',
  }
}

export async function actualizarConfig(clave: string, valor: string): Promise<void> {
  const { data: rows, error: fetchError } = await serviceClient
    .from('config')
    .select('id')
    .limit(1)
    .single()

  if (fetchError || !rows) return

  const { error } = await serviceClient
    .from('config')
    .update({ [clave]: valor })
    .eq('id', rows.id)

  if (error) throw error
}

// ─── Canchas ─────────────────────────────────────────────────────────────────

export async function getCanchas(): Promise<Cancha[]> {
  const { data, error } = await serviceClient
    .from('canchas')
    .select('*')
    .eq('activa', true)

  if (error) throw error
  return (data || []).map(mapCancha)
}

export async function getCancha(id: string): Promise<Cancha | null> {
  const { data, error } = await serviceClient
    .from('canchas')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return mapCancha(data)
}

export async function crearCancha(data: Omit<Cancha, 'id'>): Promise<Cancha> {
  const { data: row, error } = await serviceClient
    .from('canchas')
    .insert({
      nombre: data.nombre,
      descripcion: data.descripcion,
      foto_url: data.foto_url,
      activa: data.activa,
      precio: data.precio,
      color: data.color || '#1e3a5f',
    })
    .select()
    .single()

  if (error || !row) throw error
  return mapCancha(row)
}

export async function actualizarCancha(id: string, data: Partial<Cancha>): Promise<Cancha> {
  const fields: Record<string, unknown> = {}
  if (data.nombre !== undefined) fields.nombre = data.nombre
  if (data.descripcion !== undefined) fields.descripcion = data.descripcion
  if (data.foto_url !== undefined) fields.foto_url = data.foto_url
  if (data.activa !== undefined) fields.activa = data.activa
  if (data.precio !== undefined) fields.precio = data.precio
  if (data.color !== undefined) fields.color = data.color

  const { data: row, error } = await serviceClient
    .from('canchas')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error || !row) throw error
  return mapCancha(row)
}

export async function eliminarCancha(id: string): Promise<void> {
  const { error } = await serviceClient.from('canchas').delete().eq('id', id)
  if (error) throw error
}

// ─── Reservas ─────────────────────────────────────────────────────────────────

export async function getReservas(fecha?: string): Promise<Reserva[]> {
  console.log('[getReservas] fecha param:', fecha)

  let query = serviceClient
    .from('reservas')
    .select('*, canchas(nombre, precio, color)')
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (fecha) {
    query = query.eq('fecha', fecha)
  }

  const { data, error } = await query
  console.log('[getReservas] error:', error)
  console.log('[getReservas] rows encontradas:', data?.length)
  if (error) throw error
  return (data || []).map(mapReserva)
}

export async function getReservaById(id: string): Promise<Reserva | null> {
  const { data, error } = await serviceClient
    .from('reservas')
    .select('*, canchas(nombre, precio)')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return mapReserva(data)
}

export async function crearReserva(data: Omit<Reserva, 'id'>): Promise<Reserva> {
  const { data: row, error } = await serviceClient
    .from('reservas')
    .insert({
      id_reserva: data.id_reserva ?? `RES-${Date.now()}`,
      cancha_id: data.cancha_id,
      fecha: data.fecha,
      hora_inicio: data.hora_inicio,
      hora_fin: data.hora_fin,
      nombre_cliente: data.nombre_cliente,
      telefono: data.telefono,
      email: data.email,
      estado: data.estado,
      notas: data.notas || '',
      ...(data.profile_id ? { profile_id: data.profile_id } : {}),
      ...(data.metodo_pago ? { metodo_pago: data.metodo_pago } : {}),
      ...(data.pago_estado ? { pago_estado: data.pago_estado } : {}),
    })
    .select('*, canchas(nombre, precio)')
    .single()

  if (error || !row) throw error
  return mapReserva(row)
}

export async function actualizarPago(
  id: string,
  fields: { pago_estado?: string; estado?: string; stripe_session_id?: string; monto_pagado?: number }
): Promise<void> {
  const { error } = await serviceClient
    .from('reservas')
    .update(fields)
    .eq('id', id)

  if (error) throw error
}

export async function actualizarReserva(id: string, data: Partial<Reserva>): Promise<Reserva> {
  const fields: Record<string, unknown> = {}
  if (data.cancha_id) fields.cancha_id = data.cancha_id
  if (data.fecha) fields.fecha = data.fecha
  if (data.hora_inicio) fields.hora_inicio = data.hora_inicio
  if (data.hora_fin) fields.hora_fin = data.hora_fin
  if (data.nombre_cliente) fields.nombre_cliente = data.nombre_cliente
  if (data.telefono) fields.telefono = data.telefono
  if (data.email) fields.email = data.email
  if (data.estado) fields.estado = data.estado
  if (data.notas !== undefined) fields.notas = data.notas

  const { data: row, error } = await serviceClient
    .from('reservas')
    .update(fields)
    .eq('id', id)
    .select('*, canchas(nombre, precio)')
    .single()

  if (error || !row) throw error
  return mapReserva(row)
}

export async function cancelarReserva(id: string): Promise<void> {
  const { error } = await serviceClient
    .from('reservas')
    .update({ estado: 'Cancelada' })
    .eq('id', id)

  if (error) throw error
}

export async function checkConflicto(
  cancha_id: string,
  fecha: string,
  hora_inicio: string,
  hora_fin: string
): Promise<boolean> {
  const { data, error } = await serviceClient
    .from('reservas')
    .select('id')
    .eq('cancha_id', cancha_id)
    .eq('fecha', fecha)
    .neq('estado', 'Cancelada')
    .lt('hora_inicio', hora_fin)
    .gt('hora_fin', hora_inicio)

  if (error) throw error
  return (data || []).length > 0
}

// ─── Bloqueos ─────────────────────────────────────────────────────────────────

export async function getBloqueos(): Promise<Bloqueo[]> {
  const { data, error } = await serviceClient
    .from('bloqueos')
    .select('*, canchas(nombre)')

  if (error) throw error
  return (data || []).map(mapBloqueo)
}

export async function crearBloqueo(data: Omit<Bloqueo, 'id'>): Promise<Bloqueo> {
  const { data: row, error } = await serviceClient
    .from('bloqueos')
    .insert({
      cancha_id: data.cancha_id,
      motivo: data.motivo,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
    })
    .select('*, canchas(nombre)')
    .single()

  if (error || !row) throw error
  return mapBloqueo(row)
}

export async function eliminarBloqueo(id: string): Promise<void> {
  const { error } = await serviceClient.from('bloqueos').delete().eq('id', id)
  if (error) throw error
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapCancha(row: Record<string, unknown>): Cancha {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    descripcion: row.descripcion as string,
    foto_url: row.foto_url as string,
    activa: row.activa as boolean,
    precio: row.precio as number,
    color: row.color as string,
  }
}

function mapReserva(row: Record<string, unknown>): Reserva {
  const canchas = row.canchas as Record<string, unknown> | null
  return {
    id: row.id as string,
    cancha_id: row.cancha_id as string,
    cancha_nombre: canchas?.nombre as string | undefined,
    fecha: row.fecha as string,
    hora_inicio: row.hora_inicio as string,
    hora_fin: row.hora_fin as string,
    nombre_cliente: row.nombre_cliente as string,
    telefono: row.telefono as string,
    email: row.email as string,
    estado: row.estado as Reserva['estado'],
    notas: row.notas as string | undefined,
    metodo_pago: row.metodo_pago as Reserva['metodo_pago'],
    pago_estado: row.pago_estado as Reserva['pago_estado'],
    stripe_session_id: row.stripe_session_id as string | undefined,
    monto_pagado: row.monto_pagado as number | undefined,
    created_at: row.created_at as string | undefined,
  }
}

function mapBloqueo(row: Record<string, unknown>): Bloqueo {
  return {
    id: row.id as string,
    cancha_id: row.cancha_id as string,
    motivo: row.motivo as string,
    fecha_inicio: row.fecha_inicio as string,
    fecha_fin: row.fecha_fin as string,
  }
}
