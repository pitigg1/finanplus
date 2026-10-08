package uis.entornos.finanplus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

// Datos que se pueden cambiar de un usuario desde la página Usuarios.
// El correo no se cambia (es con el que se inicia sesión).
@Data
public class ActualizarUsuarioDTO {
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede tener más de 100 caracteres")
    private String nombre;

    @Size(max = 10, message = "La moneda no puede tener más de 10 caracteres")
    private String monedaPreferida;

    @Size(max = 80, message = "El país no puede tener más de 80 caracteres")
    private String pais;

    // ACTIVO, INACTIVO o SUSPENDIDO (solo ACTIVO puede iniciar sesión)
    @Pattern(regexp = "ACTIVO|INACTIVO|SUSPENDIDO", message = "El estado debe ser ACTIVO, INACTIVO o SUSPENDIDO")
    private String estado;

    // Opcional: si viene vacío, se conserva la contraseña actual
    @Size(max = 100, message = "La contraseña es demasiado larga")
    private String password;
}
