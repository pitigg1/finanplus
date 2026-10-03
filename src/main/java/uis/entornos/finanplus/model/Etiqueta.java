package uis.entornos.finanplus.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Entity
@Table(name = "Etiquetas")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Etiqueta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_etiqueta")
    private Integer idEtiqueta;

    @NotBlank(message = "El nombre de la etiqueta es obligatorio")
    @Size(max = 100)
    @Column(unique = true)
    private String nombre;
}
