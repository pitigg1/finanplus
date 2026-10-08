package uis.entornos.finanplus.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponseDTO {
	private String token;
    @Builder.Default
    private String type = "Bearer";
    private UsuarioResponseDTO usuario;
}
