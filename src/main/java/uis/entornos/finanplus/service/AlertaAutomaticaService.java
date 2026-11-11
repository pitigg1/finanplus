package uis.entornos.finanplus.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import uis.entornos.finanplus.config.ProgramacionConfig;
import uis.entornos.finanplus.enums.EstadoMeta;
import uis.entornos.finanplus.enums.EstadoUsuario;
import uis.entornos.finanplus.enums.NivelPrioridad;
import uis.entornos.finanplus.enums.TipoAlerta;
import uis.entornos.finanplus.enums.TipoMovimiento;
import uis.entornos.finanplus.event.EvaluarAlertasEvent;
import uis.entornos.finanplus.model.MetaAhorro;
import uis.entornos.finanplus.model.Notificacion;
import uis.entornos.finanplus.model.Presupuesto;
import uis.entornos.finanplus.model.RegistroFinanciero;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.MetaAhorroRepository;
import uis.entornos.finanplus.repository.NotificacionRepository;
import uis.entornos.finanplus.repository.PresupuestoRepository;
import uis.entornos.finanplus.repository.RegistroFinancieroRepository;
import uis.entornos.finanplus.repository.UsuarioRepository;

/**
 * Genera notificaciones automáticas. Reglas (usan los tipos de alerta que ya existen):
 *
 *  - GASTO_ELEVADO         : lo gastado en un presupuesto del mes llegó al 80 % del límite.
 *  - PRESUPUESTO_EXCEDIDO  : lo gastado superó el límite del presupuesto.
 *  - META_PROXIMA_VENCER   : a una meta ACTIVA le quedan 7 días o menos y aún no llega al objetivo.
 *  - META_CUMPLIDA         : un aporte hizo que la meta llegara al objetivo.
 *  - GASTO_SUPERA_INGRESOS : en el mes actual los gastos son mayores que los ingresos.
 *
 * Cada alerta se crea UNA sola vez: antes de crearla se busca si ya existe una del mismo tipo para
 * el mismo elemento (id_referencia). Para GASTO_SUPERA_INGRESOS la referencia es el mes ("2026-11"),
 * así que se avisa una vez por mes.
 *
 * Cuándo se ejecuta: (1) cada vez que el usuario crea o edita un registro (evento, después del commit)
 * y (2) todos los días por la tarea programada, que es la única que detecta metas próximas a vencer.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AlertaAutomaticaService implements IAlertaAutomaticaService {

    static final int DIAS_AVISO_META = 7;
    static final BigDecimal UMBRAL_GASTO_ELEVADO = new BigDecimal("0.80");

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final NotificacionRepository notificacionRepository;
    private final PresupuestoRepository presupuestoRepository;
    private final MetaAhorroRepository metaRepository;
    private final RegistroFinancieroRepository registroRepository;
    private final UsuarioRepository usuarioRepository;
    private final PlatformTransactionManager transactionManager;

    // ------------------------------------------------------------------ puntos de entrada

    @Override
    public int evaluarTodos() {
        int total = 0;
        for (Usuario u : usuarioRepository.findAll()) {
            if (u.getEstado() != EstadoUsuario.ACTIVO) continue;
            String correo = u.getCorreo();
            try {
                total += evaluarEnNuevaTransaccion(correo);
            } catch (Exception e) {
                log.error("No se pudieron generar las alertas de {}", correo, e);
            }
        }
        if (total > 0) log.info("Alertas automáticas: {} notificación(es) nueva(s)", total);
        return total;
    }

    @Override
    @Transactional
    public int evaluarUsuario(String correoUsuario) {
        return evaluar(buscarUsuario(correoUsuario));
    }

    @Override
    public void notificarMetaCumplida(MetaAhorro meta) {
        crearSiNoExiste(meta.getUsuario(), TipoAlerta.META_CUMPLIDA,
                "¡Meta cumplida!",
                "Alcanzaste tu meta «" + meta.getNombre() + "» de "
                        + moneda(meta.getUsuario(), meta.getMontoObjetivo()) + ". ¡Felicitaciones!",
                meta.getIdMeta(), NivelPrioridad.ALTA);
    }

    /**
     * Se dispara cuando se confirma la transacción que creó/editó un registro. Corre en una transacción
     * nueva y atrapa cualquier error: una falla al generar alertas nunca debe afectar el registro ya guardado.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void alCambiarMovimientos(EvaluarAlertasEvent evento) {
        try {
            evaluarEnNuevaTransaccion(evento.correoUsuario());
        } catch (Exception e) {
            log.error("No se pudieron generar las alertas de {}", evento.correoUsuario(), e);
        }
    }

    private int evaluarEnNuevaTransaccion(String correoUsuario) {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        Integer creadas = tx.execute(status -> evaluar(buscarUsuario(correoUsuario)));
        return creadas == null ? 0 : creadas;
    }

    private Usuario buscarUsuario(String correo) {
        return usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con correo: " + correo));
    }

    // ------------------------------------------------------------------ reglas

    private int evaluar(Usuario usuario) {
        LocalDate hoy = LocalDate.now(ProgramacionConfig.ZONA);
        return alertasDePresupuestos(usuario, hoy)
                + alertasDeMetas(usuario, hoy)
                + alertaGastosSuperanIngresos(usuario, hoy);
    }

    private int alertasDePresupuestos(Usuario usuario, LocalDate hoy) {
        int creadas = 0;
        for (Presupuesto p : presupuestoRepository.findByUsuarioCorreo(usuario.getCorreo())) {
            // solo importan los presupuestos del mes en curso
            if (p.getMes() != hoy.getMonthValue() || p.getAnio() != hoy.getYear()) continue;

            BigDecimal gastado = registroRepository.sumarPorCategoriaYMes(
                    usuario.getIdUsuario(), p.getCategoria().getIdCategoria(),
                    TipoMovimiento.GASTO, p.getMes(), p.getAnio());
            BigDecimal limite = p.getLimiteGasto();
            String categoria = p.getCategoria().getNombre();

            if (gastado.compareTo(limite) > 0) {
                creadas += crearSiNoExiste(usuario, TipoAlerta.PRESUPUESTO_EXCEDIDO,
                        "Superaste el presupuesto de " + categoria,
                        "Llevas " + moneda(usuario, gastado) + " gastados en «" + categoria
                                + "» y tu límite de este mes era " + moneda(usuario, limite) + ".",
                        p.getIdPresupuesto(), NivelPrioridad.ALTA) ? 1 : 0;
            } else if (limite.signum() > 0
                    && gastado.compareTo(limite.multiply(UMBRAL_GASTO_ELEVADO)) >= 0) {
                BigDecimal pct = gastado.multiply(BigDecimal.valueOf(100)).divide(limite, 0, RoundingMode.HALF_UP);
                creadas += crearSiNoExiste(usuario, TipoAlerta.GASTO_ELEVADO,
                        "Vas por el " + pct + " % del presupuesto de " + categoria,
                        "Has gastado " + moneda(usuario, gastado) + " de " + moneda(usuario, limite)
                                + " en «" + categoria + "». Te quedan " + moneda(usuario, limite.subtract(gastado)) + ".",
                        p.getIdPresupuesto(), NivelPrioridad.MEDIA) ? 1 : 0;
            }
        }
        return creadas;
    }

    private int alertasDeMetas(Usuario usuario, LocalDate hoy) {
        int creadas = 0;
        for (MetaAhorro m : metaRepository.findByUsuarioCorreo(usuario.getCorreo())) {
            if (m.getEstado() != EstadoMeta.ACTIVA || m.getFechaObjetivo() == null) continue;
            if (m.getMontoActual().compareTo(m.getMontoObjetivo()) >= 0) continue;

            long dias = ChronoUnit.DAYS.between(hoy, m.getFechaObjetivo());
            if (dias < 0 || dias > DIAS_AVISO_META) continue;

            BigDecimal falta = m.getMontoObjetivo().subtract(m.getMontoActual());
            BigDecimal pct = m.getMontoActual().multiply(BigDecimal.valueOf(100))
                    .divide(m.getMontoObjetivo(), 0, RoundingMode.DOWN);
            String cuando = dias == 0 ? "vence hoy" : dias == 1 ? "vence mañana" : "vence en " + dias + " días";

            creadas += crearSiNoExiste(usuario, TipoAlerta.META_PROXIMA_VENCER,
                    "Tu meta «" + m.getNombre() + "» " + cuando,
                    "La fecha límite es el " + m.getFechaObjetivo().format(FECHA) + ". Llevas el " + pct
                            + " % y te faltan " + moneda(usuario, falta) + ".",
                    m.getIdMeta(), dias <= 3 ? NivelPrioridad.ALTA : NivelPrioridad.MEDIA) ? 1 : 0;
        }
        return creadas;
    }

    private int alertaGastosSuperanIngresos(Usuario usuario, LocalDate hoy) {
        List<RegistroFinanciero> delMes = registroRepository.findByUsuarioCorreo(usuario.getCorreo()).stream()
                .filter(r -> r.getFechaMovimiento() != null
                        && r.getFechaMovimiento().getYear() == hoy.getYear()
                        && r.getFechaMovimiento().getMonthValue() == hoy.getMonthValue())
                .toList();
        BigDecimal ingresos = sumar(delMes, TipoMovimiento.INGRESO);
        BigDecimal gastos = sumar(delMes, TipoMovimiento.GASTO);

        if (gastos.signum() > 0 && gastos.compareTo(ingresos) > 0) {
            return crearSiNoExiste(usuario, TipoAlerta.GASTO_SUPERA_INGRESOS,
                    "Este mes gastas más de lo que ingresas",
                    "Llevas " + moneda(usuario, gastos) + " en gastos frente a " + moneda(usuario, ingresos)
                            + " en ingresos (diferencia: " + moneda(usuario, gastos.subtract(ingresos)) + ").",
                    YearMonth.from(hoy).toString(), NivelPrioridad.ALTA) ? 1 : 0;
        }
        return 0;
    }

    // ------------------------------------------------------------------ utilidades

    /** @return true si la notificación se creó, false si ya existía una igual. */
    private boolean crearSiNoExiste(Usuario usuario, TipoAlerta tipo, String titulo, String mensaje,
                                    String idReferencia, NivelPrioridad prioridad) {
        if (notificacionRepository.existsByUsuarioIdUsuarioAndTipoAlertaAndIdReferencia(
                usuario.getIdUsuario(), tipo, idReferencia)) {
            return false;
        }
        notificacionRepository.save(Notificacion.builder()
                .usuario(usuario)
                .tipoAlerta(tipo)
                .titulo(titulo.length() > 200 ? titulo.substring(0, 200) : titulo)
                .mensaje(mensaje)
                .idReferencia(idReferencia)
                .nivelPrioridad(prioridad)
                .build());
        return true;
    }

    private BigDecimal sumar(List<RegistroFinanciero> registros, TipoMovimiento tipo) {
        return registros.stream()
                .filter(r -> r.getTipoMovimiento() == tipo)
                .map(RegistroFinanciero::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String moneda(Usuario usuario, BigDecimal valor) {
        NumberFormat formato = NumberFormat.getInstance(Locale.forLanguageTag("es-CO"));
        formato.setMaximumFractionDigits(0);
        String codigo = usuario.getMonedaPreferida() != null ? usuario.getMonedaPreferida() : "COP";
        return codigo + " " + formato.format(valor);
    }
}
