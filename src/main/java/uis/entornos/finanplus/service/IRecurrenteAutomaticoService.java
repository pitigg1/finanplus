package uis.entornos.finanplus.service;

import java.time.LocalDate;

public interface IRecurrenteAutomaticoService {

    /** Registra todos los recurrentes activos que vencen hoy o antes. Devuelve cuántos registros creó. */
    int procesarPendientes(LocalDate hoy);

    /** Igual, pero solo para los recurrentes de un usuario (sirve para probar sin esperar al horario programado). */
    int procesarPendientesDeUsuario(String correoUsuario, LocalDate hoy);
}
