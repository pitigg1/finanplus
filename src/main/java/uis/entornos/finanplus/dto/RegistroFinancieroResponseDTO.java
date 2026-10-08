package uis.entornos.finanplus.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegistroFinancieroResponseDTO {
	private String idRegistro;
    private String idUsuario;
    private Integer idCategoria;
    private String nombreCategoria; 
    private String tipoMovimiento;
    private BigDecimal monto;
    private String descripcion;
    private LocalDateTime fechaMovimiento;
    private Boolean esRecurrente;
    private LocalDateTime createdAt;
 // Conjunto con los nombres de las etiquetas asignadas
    private Set<String> etiquetas;
}
