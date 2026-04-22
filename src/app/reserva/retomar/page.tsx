"use client";

import { useEffect } from "react";

export default function RetomnarReserva() {
    useEffect(() => {
        const pending = sessionStorage.getItem("reserva_pendiente");
        window.location.replace(pending ? "/#reservar" : "/");
    }, []);

    return null;
}
