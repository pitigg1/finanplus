package uis.entornos.finanplus.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegistroFinancieroRequestDTO {
	@NotNull(message = "La categoría es obligatoria")
    private Integer idCategoria;

    @NotBlank(message = "El tipo de movimiento es obligatorio")
    private String tipoMovimiento;

    @NotNull(message = "El monto es obligatorio")
    @Min(value = 0, message = "El monto no puede ser negativo")
    private BigDecimal monto;

    private String descripcion;

    @NotNull(message = "La fecha del movimiento es obligatoria")
    private LocalDateTime fechaMovimiento;

    private Boolean esRecurrente;
    
 // Lista de IDs de las etiquetas enviadas desde el frontend/postman
    private List<Integer> idsEtiquetas;

}
