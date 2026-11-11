package uis.entornos.finanplus.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import  com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import uis.entornos.finanplus.enums.Frecuencia;
import uis.entornos.finanplus.enums.TipoMovimiento;

@Entity
@Table(name = "Movimientos_Recurrentes")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler",})
public class MovimientoRecurrente {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_recurrencia", columnDefinition = "CHAR(36)")
    private String idRecurrencia;

    @Size(max = 100, message = "El nombre no puede exceder los 100 caracteres")
    @Column(length = 100)
    private String nombre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_categoria", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Categoria categoria;

    // Opcional al enviarlo: el service lo iguala al tipo de la categoría.
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

