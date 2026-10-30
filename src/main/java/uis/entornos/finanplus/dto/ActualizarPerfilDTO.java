package uis.entornos.finanplus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

// Datos que cada persona puede cambiar de SU propio perfil (el correo no se cambia: es con el que inicia sesión).
@Data
public class ActualizarPerfilDTO {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede tener más de 100 caracteres")
    private String nombre;

    @Size(max = 80, message = "El país no puede tener más de 80 caracteres")
    private String pais;

    // Código de 3 letras de la lista de monedas admitidas (COP, USD, EUR...)
    @NotBlank(message = "La moneda es obligatoria")
    @Size(max = 10, message = "La moneda no es válida")
    private String monedaPreferida;
}
