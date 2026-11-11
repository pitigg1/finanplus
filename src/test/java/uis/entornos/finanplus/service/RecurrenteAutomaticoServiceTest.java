package uis.entornos.finanplus.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;

import uis.entornos.finanplus.enums.Frecuencia;

/** Pruebas del cálculo de la siguiente fecha de un recurrente. No necesitan base de datos ni Spring. */
class RecurrenteAutomaticoServiceTest {

    @Test
    void avanzaSegunLaFrecuencia() {
        LocalDate base = LocalDate.of(2026, 11, 15);
        assertEquals(LocalDate.of(2026, 11, 16), RecurrenteAutomaticoService.siguienteFecha(base, Frecuencia.DIARIA));
        assertEquals(LocalDate.of(2026, 11, 22), RecurrenteAutomaticoService.siguienteFecha(base, Frecuencia.SEMANAL));
        assertEquals(LocalDate.of(2026, 12, 15), RecurrenteAutomaticoService.siguienteFecha(base, Frecuencia.MENSUAL));
        assertEquals(LocalDate.of(2027, 11, 15), RecurrenteAutomaticoService.siguienteFecha(base, Frecuencia.ANUAL));
    }

    @Test
    void mensualEnMesCortoSeAjustaAlUltimoDia() {
        assertEquals(LocalDate.of(2027, 2, 28),
                RecurrenteAutomaticoService.siguienteFecha(LocalDate.of(2027, 1, 31), Frecuencia.MENSUAL));
    }
}
