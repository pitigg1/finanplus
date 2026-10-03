package uis.entornos.finanplus.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import  com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import uis.entornos.finanplus.enums.Frecuencia;
import uis.entornos.finanplus.enums.TipoMovimiento;

@Entity
@Table(name = "Movimientos Recurrentes")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler",})
public class MovimientoRecurrente {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_recurrencia", columnDefinition = "CHAR(36)")
    private String idRecurrencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_categoria", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Categoria categoria;

    @NotNull(message = "El tipo de movimiento es obligatorio")
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_movimiento")
    private TipoMovimiento tipoMovimiento;

    @NotNull(message = "El monto estimado es obligatorio")
    @DecimalMin(value = "0.0", message = "El monto estimado no puede ser negativo")
    @Column(name = "monto_estimado")
    private BigDecimal montoEstimado;

    @NotNull(message = "La frecuencia es obligatoria")
    @Enumerated(EnumType.STRING)
    private Frecuencia frecuencia;

    @NotNull(message = "La próxima fecha es obligatoria")
    @Column(name = "proxima_fecha")
    private LocalDate proximaFecha;

    @Builder.Default
    private Boolean activo = true;
}

