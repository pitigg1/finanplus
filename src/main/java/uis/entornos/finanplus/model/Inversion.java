package uis.entornos.finanplus.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import uis.entornos.finanplus.enums.NivelRiesgo;
import uis.entornos.finanplus.enums.TipoActivo;

@Entity
@Table(name = "Inversiones")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Inversion {
	@Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_inversion", columnDefinition = "CHAR(36)")
    private String idInversion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "password"})
    private Usuario usuario;

    @Size(max = 150, message = "El nombre del activo no puede superar 150 caracteres")
    @Column(name = "nombre_activo", nullable = false)
    private String nombreActivo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_activo", nullable = false)
    private TipoActivo tipoActivo;

    @DecimalMin(value = "0.0", message = "El monto invertido no puede ser negativo")
    @Column(name = "monto_invertido", nullable = false, precision = 15, scale = 2)
    private BigDecimal montoInvertido;

    @DecimalMin(value = "0.0", message = "El valor actual no puede ser negativo")
    @Column(name = "valor_actual", nullable = false, precision = 15, scale = 2)
    private BigDecimal valorActual;

    @Column(precision = 8, scale = 2)
    private BigDecimal rentabilidad;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private NivelRiesgo riesgo = NivelRiesgo.MEDIO;

    @Column(name = "fecha_inversion", nullable = false)
    private LocalDate fechaInversion;

    @UpdateTimestamp
    @Column(name = "ultima_actualizacion")
    private LocalDateTime ultimaActualizacion;

}
