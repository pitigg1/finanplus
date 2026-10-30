package uis.entornos.finanplus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CambiarPasswordDTO {

    @NotBlank(message = "Escribe tu contraseña actual")
    private String actual;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 6, max = 100, message = "La nueva contraseña debe tener al menos 6 caracteres")
    private String nueva;
}
