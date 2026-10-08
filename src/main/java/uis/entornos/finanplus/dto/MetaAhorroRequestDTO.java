package uis.entornos.finanplus.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class MetaAhorroRequestDTO {
	
	@NotBlank(message = "El nombre de la meta es obligatorio")
    private String nombre;

    private String descripcion;

    @NotNull(message = "El monto objetivo es obligatorio")
    @Positive(message = "El monto objetivo debe ser mayor a 0")
    private BigDecimal montoObjetivo;

    private LocalDate fechaObjetivo;

    private String prioridad;
}
