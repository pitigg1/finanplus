package uis.entornos.finanplus.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;
import uis.entornos.finanplus.enums.EstadoUsuario;

@Data
@Builder
public class UsuarioResponseDTO {
	private String idUsuario;
    private String nombre;
    private String correo;
    private String monedaPreferida;
    private String pais;
    private String fotoPerfil;
    private EstadoUsuario estado;
    private LocalDateTime fechaRegistro;
}
