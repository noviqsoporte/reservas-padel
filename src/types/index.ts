export interface Cancha {
    id: string
    nombre: string
    descripcion: string
    foto_url: string
    activa: boolean
    precio: number
    color: string
}

export interface Reserva {
    id: string
    cancha_id: string
    cancha_nombre?: string
    fecha: string        // ISO: "2025-03-15"
    hora_inicio: string  // "09:00"
    hora_fin: string     // "10:00"
    nombre_cliente: string
    telefono: string
    email: string
    estado: 'Confirmada' | 'Cancelada' | 'Pendiente' | 'Completada' | 'No show'
    notas?: string
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
}

export interface SlotHorario {
    hora_inicio: string
    hora_fin: string
    disponible: boolean
}
