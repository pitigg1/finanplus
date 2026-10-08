package uis.entornos.finanplus.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequestDTO {
	@NotBlank(message = "El email es obligatorio")
    @Email(message = "Formato de email inválido")
    private String correo;

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
}
