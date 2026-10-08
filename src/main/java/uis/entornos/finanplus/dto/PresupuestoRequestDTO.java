package uis.entornos.finanplus.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PresupuestoRequestDTO {
	
	@NotNull(message = "La categoría es obligatoria")
    private Integer idCategoria;

    @NotNull(message = "El mes es obligatorio")
    @Min(value = 1, message = "El mes mínimo es 1")
    @Max(value = 12, message = "El mes máximo es 12")
    private Integer mes;

    @NotNull(message = "El año es obligatorio")
    private Integer anio;

    @NotNull(message = "El límite de gasto es obligatorio")
    @DecimalMin(value = "0.0",  message = "El límite de gasto no puede ser negativo")
    private BigDecimal limiteGasto;
}
