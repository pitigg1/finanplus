package uis.entornos.finanplus.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoriaResponseDTO {
	private Integer idCategoria;
    private String nombre;
    private String tipo; 
    private String icono;
    private String color;
}
