package uis.entornos.finanplus.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import uis.entornos.finanplus.enums.TipoMovimiento;

@Entity
@Table(name = "Categorias")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_categoria")
    private Integer idCategoria;

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotNull(message = "El tipo de categoría es obligatorio")
    @Enumerated(EnumType.STRING)
    private TipoMovimiento tipo;

    private String icono;
    private String color;
}
