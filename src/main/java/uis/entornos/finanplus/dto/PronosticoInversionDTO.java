package uis.entornos.finanplus.dto;

import java.math.BigDecimal;
import java.util.List;

import uis.entornos.finanplus.enums.NivelRiesgo;
import uis.entornos.finanplus.enums.TipoActivo;

/** Pronóstico de UNA inversión: tres escenarios (pesimista, esperado, optimista). */
public record PronosticoInversionDTO(
        String idInversion,
        String nombreActivo,
        TipoActivo tipoActivo,
        NivelRiesgo riesgo,
        int meses,
        BigDecimal valorActual,
        BigDecimal aporteMensual,
        BigDecimal aportesTotales,
        /** Tasa efectiva anual (%) del escenario esperado. */
        BigDecimal tasaAnualEsperada,
        /** INDICADA_POR_USUARIO, RENTABILIDAD_DE_LA_INVERSION o TASA_POR_DEFECTO (la inversión no tiene rentabilidad). */
        String origenTasa,
        List<Escenario> escenarios,
        String advertencia) {

    public static final String ADVERTENCIA =
            "Proyección estimada con supuestos y tasas de referencia; no garantiza rendimientos "
            + "ni constituye asesoría financiera profesional.";

    public record Escenario(
            String nombre,
            BigDecimal tasaAnual,
            BigDecimal valorProyectado,
            BigDecimal gananciaProyectada,
            BigDecimal rentabilidadPorcentaje) {
    }
}
