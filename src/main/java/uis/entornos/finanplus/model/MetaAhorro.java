package uis.entornos.finanplus.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import uis.entornos.finanplus.enums.EstadoMeta;
import uis.entornos.finanplus.enums.Prioridad;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "Metas_Ahorro")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MetaAhorro {
	@Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_meta", columnDefinition = "CHAR(36)")
    private String idMeta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @NotBlank(message = "El nombre de la meta es obligatorio")
    @Size(max = 120)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @NotNull(message = "El monto objetivo es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto objetivo debe ser mayor a 0")
    @Column(name = "monto_objetivo")
    private BigDecimal montoObjetivo;

    @DecimalMin(value = "0.0", message = "El monto actual no puede ser negativo")
    @Column(name = "monto_actual")
    @Builder.Default
    private BigDecimal montoActual = BigDecimal.ZERO;

    @Column(name = "fecha_objetivo")
    private LocalDate fechaObjetivo;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Prioridad prioridad = Prioridad.MEDIA;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EstadoMeta estado = EstadoMeta.ACTIVA;

    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    protected void onCreate() { this.fechaCreacion = LocalDateTime.now(); }
}
