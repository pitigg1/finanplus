package uis.entornos.finanplus.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Builder;

@Builder
public class MetaAhorroResponseDTO {
	private String idMeta;
    private String nombre;
    private String descripcion;
    private BigDecimal montoObjetivo;
    private BigDecimal montoActual;
    private LocalDate fechaObjetivo;
    private String prioridad;
    private String estado;
    private LocalDateTime fechaCreacion;
}
