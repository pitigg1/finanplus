package uis.entornos.finanplus.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.dto.PronosticoInversionDTO;
import uis.entornos.finanplus.dto.PronosticoInversionDTO.Escenario;
import uis.entornos.finanplus.dto.PronosticoPortafolioDTO;
import uis.entornos.finanplus.enums.NivelRiesgo;
import uis.entornos.finanplus.enums.TipoActivo;
import uis.entornos.finanplus.model.Inversion;
import uis.entornos.finanplus.repository.InversionRepository;

/**
 * Proyecta cuánto valdría una inversión dentro de N meses.
 *
 * Fórmula (capitalización compuesta mensual, aportes al final de cada mes):
 *   rm = (1 + tasaAnual)^(1/12) - 1
 *   VF = valorActual * (1 + rm)^n  +  aporteMensual * ((1 + rm)^n - 1) / rm
 *
 * El pronóstico es INDIVIDUAL: cada inversión se proyecta con SU propia rentabilidad
 * (porcentaje efectivo anual). La tasa esperada se elige así, en este orden:
 *   1. la que el usuario escribe en la consulta (solo al pronosticar UNA inversión);
 *   2. la rentabilidad guardada en esa inversión;
 *   3. si la inversión no tiene rentabilidad, la tasa POR DEFECTO ({@value #TASA_POR_DEFECTO} %).
 *
 * Se calculan tres escenarios: la tasa esperada y una tasa menor y mayor según el RIESGO del activo:
 * a más riesgo, más separados quedan el escenario pesimista y el optimista.
 */
@Service
@RequiredArgsConstructor
public class PronosticoInversionService implements IPronosticoInversionService {

    public static final int MESES_MAXIMOS = 600; // 50 años

    /** Tasa efectiva anual (en %) que se asigna a la inversión que no tiene rentabilidad. Es un supuesto, ajustable. */
    public static final double TASA_POR_DEFECTO = 8.0;

    /** De dónde salió la tasa del escenario esperado (campo origenTasa de la respuesta). */
    public static final String ORIGEN_USUARIO = "INDICADA_POR_USUARIO";
    public static final String ORIGEN_INVERSION = "RENTABILIDAD_DE_LA_INVERSION";
    public static final String ORIGEN_DEFECTO = "TASA_POR_DEFECTO";

    /** Límites aceptados para una tasa anual (en %). */
    private static final BigDecimal TASA_MINIMA = BigDecimal.valueOf(-99);
    private static final BigDecimal TASA_MAXIMA = BigDecimal.valueOf(1000);

    /** Cuántos puntos porcentuales se separan del escenario esperado según el riesgo. */
    private static final Map<NivelRiesgo, Double> MARGEN_POR_RIESGO = new EnumMap<>(NivelRiesgo.class);

    static {
        MARGEN_POR_RIESGO.put(NivelRiesgo.BAJO, 2.0);
        MARGEN_POR_RIESGO.put(NivelRiesgo.MEDIO, 5.0);
        MARGEN_POR_RIESGO.put(NivelRiesgo.ALTO, 12.0);
    }

    private final InversionRepository inversionRepository;

    @Override
    @Transactional(readOnly = true)
    public PronosticoInversionDTO pronosticar(String idInversion, String correoUsuario,
                                              Integer meses, BigDecimal tasaAnual, BigDecimal aporteMensual) {
        // Igual que el resto de la app: si no existe o es de otro usuario, la respuesta es la misma (404).
        Inversion inversion = inversionRepository.findById(idInversion)
                .filter(i -> i.getUsuario().getCorreo().equalsIgnoreCase(correoUsuario))
                .orElseThrow(() -> new RuntimeException("Inversión no encontrada"));
        return calcular(inversion, validarMeses(meses), tasaAnual, aporteMensual);
    }

    @Override
    @Transactional(readOnly = true)
    public PronosticoPortafolioDTO pronosticarPortafolio(String correoUsuario, Integer meses) {
        int n = validarMeses(meses);
        List<PronosticoInversionDTO> inversiones = new ArrayList<>();
        for (Inversion inv : inversionRepository.findByUsuarioCorreo(correoUsuario)) {
            inversiones.add(calcular(inv, n, null, null));
        }

        BigDecimal valorActualTotal = inversiones.stream()
                .map(PronosticoInversionDTO::valorActual)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Escenario> totales = new ArrayList<>();
        for (String nombre : new String[] {"PESIMISTA", "ESPERADO", "OPTIMISTA"}) {
            BigDecimal valor = BigDecimal.ZERO;
            for (PronosticoInversionDTO p : inversiones) {
                valor = valor.add(p.escenarios().stream()
                        .filter(e -> e.nombre().equals(nombre)).findFirst().get().valorProyectado());
            }
            BigDecimal ganancia = valor.subtract(valorActualTotal);
            totales.add(new Escenario(nombre, null, valor, ganancia, porcentaje(ganancia, valorActualTotal)));
        }
        return new PronosticoPortafolioDTO(n, valorActualTotal, totales, inversiones,
                PronosticoInversionDTO.ADVERTENCIA);
    }

    // ------------------------------------------------------------------ cálculo (sin base de datos)

    /** Pública y estática para poder probarla sin levantar Spring. */
    public static PronosticoInversionDTO calcular(Inversion inv, int meses,
                                                  BigDecimal tasaAnualPct, BigDecimal aporteMensual) {
        BigDecimal aporte = aporteMensual == null ? BigDecimal.ZERO : aporteMensual;
        if (aporte.signum() < 0) {
            throw new RuntimeException("El aporte mensual no puede ser negativo");
        }
        if (tasaAnualPct != null && !tasaEnRango(tasaAnualPct)) {
            throw new RuntimeException("La tasa anual debe estar entre -99 % y 1000 %");
        }

        TipoActivo tipo = inv.getTipoActivo() != null ? inv.getTipoActivo() : TipoActivo.OTRO;
        NivelRiesgo riesgo = inv.getRiesgo() != null ? inv.getRiesgo() : NivelRiesgo.MEDIO;

        // Tasa de ESTA inversión: la indicada > su rentabilidad > la tasa por defecto
        BigDecimal tasaPct;
        String origen;
        if (tasaAnualPct != null) {
            tasaPct = tasaAnualPct;
            origen = ORIGEN_USUARIO;
        } else if (inv.getRentabilidad() != null && tasaEnRango(inv.getRentabilidad())) {
            tasaPct = inv.getRentabilidad();
            origen = ORIGEN_INVERSION;
        } else {
            tasaPct = BigDecimal.valueOf(TASA_POR_DEFECTO);
            origen = ORIGEN_DEFECTO;
        }
        double esperada = tasaPct.doubleValue() / 100.0;
        double margen = MARGEN_POR_RIESGO.get(riesgo) / 100.0;

        BigDecimal valorActual = inv.getValorActual() != null ? inv.getValorActual() : BigDecimal.ZERO;

        List<Escenario> escenarios = List.of(
                escenario("PESIMISTA", esperada - margen, valorActual, aporte, meses),
                escenario("ESPERADO", esperada, valorActual, aporte, meses),
                escenario("OPTIMISTA", esperada + margen, valorActual, aporte, meses));

        return new PronosticoInversionDTO(
                inv.getIdInversion(), inv.getNombreActivo(), tipo, riesgo, meses,
                valorActual.setScale(2, RoundingMode.HALF_UP),
                aporte.setScale(2, RoundingMode.HALF_UP),
                aporte.multiply(BigDecimal.valueOf(meses)).setScale(2, RoundingMode.HALF_UP),
                tasaPct.setScale(2, RoundingMode.HALF_UP),
                origen,
                escenarios,
                PronosticoInversionDTO.ADVERTENCIA);
    }

    private static Escenario escenario(String nombre, double tasaAnual, BigDecimal valorActual,
                                       BigDecimal aporte, int meses) {
        double t = Math.max(tasaAnual, -0.99);                  // nunca pierde más del 99 % al año
        double factor = Math.pow(1 + t, meses / 12.0);          // (1 + rm)^n
        double rm = Math.pow(1 + t, 1.0 / 12.0) - 1;            // tasa mensual equivalente
        double anualidad = Math.abs(rm) < 1e-12 ? meses : (factor - 1) / rm;

        BigDecimal valorFinal = valorActual.multiply(BigDecimal.valueOf(factor))
                .add(aporte.multiply(BigDecimal.valueOf(anualidad)))
                .max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal aportado = valorActual.add(aporte.multiply(BigDecimal.valueOf(meses)));
        BigDecimal ganancia = valorFinal.subtract(aportado).setScale(2, RoundingMode.HALF_UP);

        return new Escenario(nombre,
                BigDecimal.valueOf(t * 100).setScale(2, RoundingMode.HALF_UP),
                valorFinal, ganancia, porcentaje(ganancia, aportado));
    }

    private static boolean tasaEnRango(BigDecimal tasaPct) {
        return tasaPct.compareTo(TASA_MINIMA) >= 0 && tasaPct.compareTo(TASA_MAXIMA) <= 0;
    }

    private static BigDecimal porcentaje(BigDecimal parte, BigDecimal total) {
        if (total.signum() <= 0) return BigDecimal.ZERO.setScale(2);
        return parte.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP);
    }

    private static int validarMeses(Integer meses) {
        int n = meses == null ? 12 : meses;
        if (n < 1 || n > MESES_MAXIMOS) {
            throw new RuntimeException("El plazo debe estar entre 1 y " + MESES_MAXIMOS + " meses");
        }
        return n;
    }
}
