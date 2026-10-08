package uis.entornos.finanplus.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uis.entornos.finanplus.enums.TipoMovimiento;

@Entity
@Table(name = "Registros_Financieros")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RegistroFinanciero {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_registro", columnDefinition = "CHAR(36)")
    private String idRegistro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_categoria", nullable = false)
    private Categoria categoria;

    @NotNull(message = "El tipo de movimiento es obligatorio")
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_movimiento")
    private TipoMovimiento tipoMovimiento;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.0", inclusive = true, message = "El monto debe ser mayor o igual a 0")
    private BigDecimal monto;

    @Size(max = 255)
    private String descripcion;

    @NotNull(message = "La fecha del movimiento es obligatoria")
    @Column(name = "fecha_movimiento")
    private LocalDateTime fechaMovimiento;

    @Column(name = "es_recurrente")
    @Builder.Default
    private Boolean esRecurrente = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "Registro_Etiqueta",
        joinColumns = @JoinColumn(name = "id_registro", columnDefinition = "CHAR(36)"),
        inverseJoinColumns = @JoinColumn(name = "id_etiqueta")
    )
    @Builder.Default
    private Set<Etiqueta> etiquetas = new HashSet<>();

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}