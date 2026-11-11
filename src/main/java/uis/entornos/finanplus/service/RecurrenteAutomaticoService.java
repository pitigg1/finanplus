package uis.entornos.finanplus.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import uis.entornos.finanplus.enums.Frecuencia;
import uis.entornos.finanplus.model.MovimientoRecurrente;
import uis.entornos.finanplus.model.RegistroFinanciero;
import uis.entornos.finanplus.repository.MovimientoRecurrenteRepository;
import uis.entornos.finanplus.repository.RegistroFinancieroRepository;

/**
 * Convierte los movimientos recurrentes en registros financieros reales cuando llega su fecha.
 *
 * Para cada recurrente activo con proximaFecha <= hoy:
 *   1. crea un RegistroFinanciero (es_recurrente = true) con fecha = proximaFecha
 *   2. avanza proximaFecha según la frecuencia
 *   3. repite mientras la nueva fecha siga siendo <= hoy (se "pone al día" si la app estuvo apagada)
 *
 * Cada recurrente se procesa en su propia transacción: si uno falla, los demás siguen, y
 * nunca se crea un registro sin avanzar la fecha (no hay duplicados al reintentar).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecurrenteAutomaticoService implements IRecurrenteAutomaticoService {

    /** Tope de registros por recurrente y ejecución, para no entrar en un ciclo enorme si la fecha es muy antigua. */
    static final int MAX_OCURRENCIAS_POR_EJECUCION = 400;

    private final MovimientoRecurrenteRepository recurrenteRepository;
    private final RegistroFinancieroRepository registroRepository;
    private final PlatformTransactionManager transactionManager;

    @Override
    public int procesarPendientes(LocalDate hoy) {
        return procesar(recurrenteRepository.findByActivoTrueAndProximaFechaLessThanEqual(hoy), hoy);
    }

    @Override
    public int procesarPendientesDeUsuario(String correoUsuario, LocalDate hoy) {
        return procesar(recurrenteRepository
                .findByActivoTrueAndProximaFechaLessThanEqualAndUsuarioCorreo(hoy, correoUsuario), hoy);
    }

    private int procesar(List<MovimientoRecurrente> pendientes, LocalDate hoy) {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        int total = 0;
        for (MovimientoRecurrente pendiente : pendientes) {
            String id = pendiente.getIdRecurrencia();
            try {
                Integer creados = tx.execute(status -> procesarUno(id, hoy));
                total += creados == null ? 0 : creados;
            } catch (Exception e) {
                log.error("No se pudo procesar el recurrente {}", id, e);
            }
        }
        if (total > 0) {
            log.info("Recurrentes automáticos: {} registro(s) creado(s)", total);
        }
        return total;
    }

    private int procesarUno(String idRecurrencia, LocalDate hoy) {
        MovimientoRecurrente r = recurrenteRepository.findById(idRecurrencia).orElse(null);
        if (r == null || !Boolean.TRUE.equals(r.getActivo())) return 0;

        int creados = 0;
        LocalDate fecha = r.getProximaFecha();
        while (!fecha.isAfter(hoy) && creados < MAX_OCURRENCIAS_POR_EJECUCION) {
            registroRepository.save(RegistroFinanciero.builder()
                    .usuario(r.getUsuario())
                    .categoria(r.getCategoria())
                    .tipoMovimiento(r.getTipoMovimiento())
                    .monto(r.getMontoEstimado())
                    .descripcion("Recurrente " + r.getFrecuencia().name().toLowerCase() + ": "
                            + (r.getNombre() != null && !r.getNombre().isBlank()
                                    ? r.getNombre() : r.getCategoria().getNombre()))
                    .fechaMovimiento(fecha.atStartOfDay())
                    .esRecurrente(true)
                    .build());
            fecha = siguienteFecha(fecha, r.getFrecuencia());
            creados++;
        }
        r.setProximaFecha(fecha);
        recurrenteRepository.save(r);
        return creados;
    }

    /**
     * Calcula la siguiente ocurrencia. Pública y estática para poder probarla sin Spring.
     * Nota: en frecuencia MENSUAL un día 31 pasa a 30/28 en los meses cortos y ya no vuelve al 31.
     */
    public static LocalDate siguienteFecha(LocalDate fecha, Frecuencia frecuencia) {
        return switch (frecuencia) {
            case DIARIA -> fecha.plusDays(1);
            case SEMANAL -> fecha.plusWeeks(1);
            case MENSUAL -> fecha.plusMonths(1);
            case ANUAL -> fecha.plusYears(1);
        };
    }
}
