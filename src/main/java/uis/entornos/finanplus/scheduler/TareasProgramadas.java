package uis.entornos.finanplus.scheduler;

import java.time.LocalDate;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import uis.entornos.finanplus.config.ProgramacionConfig;
import uis.entornos.finanplus.service.IAlertaAutomaticaService;
import uis.entornos.finanplus.service.IRecurrenteAutomaticoService;

/**
 * Tareas que corren solas:
 *  - 00:05 (hora de Colombia): registra los movimientos recurrentes que vencen hoy o antes.
 *  - 00:30: genera las alertas (así ya cuentan los registros que acaba de crear la tarea anterior).
 *  - Al arrancar la aplicación: ejecuta ambas una vez, para ponerse al día si el servidor
 *    estuvo apagado a medianoche (algo habitual cuando se corre en un computador personal).
 *
 * Se pueden desactivar con  finanplus.tareas.habilitadas=false  en application.properties.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "finanplus.tareas.habilitadas", havingValue = "true", matchIfMissing = true)
public class TareasProgramadas {

    private final IRecurrenteAutomaticoService recurrenteService;
    private final IAlertaAutomaticaService alertaService;

    @Scheduled(cron = "0 5 0 * * *", zone = ProgramacionConfig.ZONA_ID)
    public void registrarRecurrentes() {
        recurrenteService.procesarPendientes(LocalDate.now(ProgramacionConfig.ZONA));
    }

    @Scheduled(cron = "0 30 0 * * *", zone = ProgramacionConfig.ZONA_ID)
    public void generarAlertas() {
        alertaService.evaluarTodos();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void alArrancar() {
        try {
            registrarRecurrentes();
            generarAlertas();
        } catch (Exception e) {
            log.error("Falló la ejecución inicial de las tareas programadas", e);
        }
    }
}
