package uis.entornos.finanplus.model;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Data @NoArgsConstructor @AllArgsConstructor
public class RegistroEtiquetaId implements Serializable {

    @Column(name = "id_registro", columnDefinition = "CHAR(36)")
    private String idRegistro;

    @Column(name = "id_etiqueta")
    private Integer idEtiqueta;
}
