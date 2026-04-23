export interface Cancha {
    id: string
    nombre: string
    descripcion: string
    foto_url: string
    activa: boolean
    precio: number
    precio_pico?: number
    color: string
}

export interface Reserva {
    id: string
    cancha_id: string          // UUID directo (antes era string[] de Airtable)
    cancha_nombre?: string
    fecha: string              // ISO: "2025-03-15"
    hora_inicio: string        // "09:00"
    hora_fin: string           // "10:00"
    nombre_cliente: string
    telefono: string
    email: string
    estado: 'Confirmada' | 'Cancelada' | 'Pendiente' | 'Completada' | 'No show'
    notas?: string
    id_reserva?: string
    profile_id?: string
    metodo_pago?: 'efectivo' | 'online'
    pago_estado?: 'pendiente' | 'pagado' | 'fallido'
    stripe_session_id?: string
    monto_pagado?: number
    created_at?: string
}

export interface Bloqueo {
    id: string
    cancha_id: string
    motivo: string
    fecha_inicio: string
    fecha_fin: string
}

export interface Config {
    negocio_nombre: string
    horario_apertura: string
    horario_cierre: string
    dias_operacion: string[]
    direccion: string
    telefono: string
    instagram: string
    horas_pico?: string
    dias_pico?: string
    hero_imagen_url?: string
}

export interface SlotHorario {
    hora_inicio: string
    hora_fin: string
    disponible: boolean
    es_pico?: boolean
    precio?: number
}

export interface Profile {
    id: string
    email: string
    nombre?: string
    created_at: string
}

export interface Lead {
    id: string
    nombre: string
    email: string
    telefono?: string
    fuente?: string
    estado: string
    created_at: string
}

export interface Promocion {
    id: string
    titulo: string
    descripcion?: string
    descuento: number
    activa: boolean
    imagen_url?: string
    fecha_inicio?: string
    fecha_fin?: string
}

export interface FotoGaleria {
    id: string
    imagen_url: string
    orden: number
    activa: boolean
    created_at?: string
}
