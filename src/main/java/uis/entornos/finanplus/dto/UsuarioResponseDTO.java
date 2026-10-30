package uis.entornos.finanplus.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;
import uis.entornos.finanplus.enums.EstadoUsuario;
import uis.entornos.finanplus.enums.Rol;

@Data
@Builder
public class UsuarioResponseDTO {
	private String idUsuario;
    private String nombre;
    private String correo;
    private String monedaPreferida;
    private String pais;
    private boolean tieneFoto;
    private EstadoUsuario estado;
    private Rol rol;
    private LocalDateTime fechaRegistro;
}
