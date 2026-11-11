package uis.entornos.finanplus.config;

import java.time.ZoneId;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Activa las tareas programadas (@Scheduled) de la aplicación y define la zona horaria
 * con la que se decide "qué día es hoy" (recurrentes, metas próximas a vencer, etc.).
 */
@Configuration
@EnableScheduling
public class ProgramacionConfig {

    public static final String ZONA_ID = "America/Bogota";
    public static final ZoneId ZONA = ZoneId.of(ZONA_ID);
}
