package uis.entornos.finanplus.model;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "Presupuestos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Presupuesto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_presupuesto", columnDefinition = "CHAR(36)")
    private String idPresupuesto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_categoria", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Categoria categoria;

    @NotNull(message = "El mes es obligatorio")
    @Min(value = 1, message = "El mes debe estar entre 1 y 12")
    @Max(value = 12, message = "El mes debe estar entre 1 y 12")
    private Integer mes;

    @NotNull(message = "El año es obligatorio")
    @Min(value = 2000, message = "Año inválido")
    private Integer anio;

    @NotNull(message = "El límite de gasto es obligatorio")
    @DecimalMin(value = "0.0", message = "El límite no puede ser negativo")
    @Column(name = "limite_gasto")
    private BigDecimal limiteGasto;

    @DecimalMin(value = "0.0", message = "El gasto actual no puede ser negativo")
    @Column(name = "gasto_actual")
    @Builder.Default
    private BigDecimal gastoActual = BigDecimal.ZERO;
}
