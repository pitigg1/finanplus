package uis.entornos.finanplus.service;

import java.math.BigDecimal;

import uis.entornos.finanplus.dto.PronosticoInversionDTO;
import uis.entornos.finanplus.dto.PronosticoPortafolioDTO;

public interface IPronosticoInversionService {

    /**
     * @param tasaAnual     tasa efectiva anual en % (ej. 10 = 10 %). Si es null se usa la rentabilidad de la inversión
     *                      y, si no tiene, la tasa por defecto.
     * @param aporteMensual dinero que se sumaría cada mes (null = 0)
     */
    PronosticoInversionDTO pronosticar(String idInversion, String correoUsuario,
                                       Integer meses, BigDecimal tasaAnual, BigDecimal aporteMensual);

    PronosticoPortafolioDTO pronosticarPortafolio(String correoUsuario, Integer meses);
}
