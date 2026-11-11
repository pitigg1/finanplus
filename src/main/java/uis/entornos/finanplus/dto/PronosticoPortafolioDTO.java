package uis.entornos.finanplus.dto;

import java.math.BigDecimal;
import java.util.List;

/** Pronóstico de todas las inversiones del usuario, con el total por escenario. */
public record PronosticoPortafolioDTO(
        int meses,
        BigDecimal valorActualTotal,
        List<PronosticoInversionDTO.Escenario> totalPorEscenario,
        List<PronosticoInversionDTO> inversiones,
        String advertencia) {
}
