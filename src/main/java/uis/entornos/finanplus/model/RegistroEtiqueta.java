package uis.entornos.finanplus.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Registro_Etiqueta")
@Data @NoArgsConstructor @AllArgsConstructor
public class RegistroEtiqueta {

    @EmbeddedId
    private RegistroEtiquetaId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("idRegistro")
    @JoinColumn(name = "id_registro")
    @JsonIgnore
    private RegistroFinanciero registro;

    @ManyToOne
    @MapsId("idEtiqueta")
    @JoinColumn(name = "id_etiqueta")
    private Etiqueta etiqueta;
}
