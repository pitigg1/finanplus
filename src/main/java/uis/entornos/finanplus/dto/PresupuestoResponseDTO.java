package uis.entornos.finanplus.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PresupuestoResponseDTO {
	private String idPresupuesto;
    private Integer idCategoria;
    private String nombreCategoria; 
    private Integer mes;
    private Integer anio;
    private BigDecimal limiteGasto;
    private BigDecimal gastoActual;
}
