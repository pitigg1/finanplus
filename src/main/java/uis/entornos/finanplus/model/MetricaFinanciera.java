package uis.entornos.finanplus.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import uis.entornos.finanplus.enums.NivelRiesgo;

@Entity
@Table(name = "Metricas_Financieras")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MetricaFinanciera {
	
	@Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_metrica", columnDefinition = "CHAR(36)")
    private String idMetrica;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "password"})
    private Usuario usuario;

    @Column(name = "fecha_calculo")
    private LocalDateTime fechaCalculo;

    @DecimalMin(value = "0.0", message = "Los ingresos totales no pueden ser negativos")
    @Column(name = "ingresos_totales", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal ingresosTotales = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", message = "Los gastos totales no pueden ser negativos")
    @Column(name = "gastos_totales", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal gastosTotales = BigDecimal.ZERO;

    @Column(name = "tasa_ahorro", precision = 5, scale = 2)
    private BigDecimal tasaAhorro;

    @Column(name = "flujo_neto", precision = 15, scale = 2)
    private BigDecimal flujoNeto;

    @DecimalMin(value = "0.00", message = "El score financiero no puede ser negativo")
    @DecimalMax(value = "999.99", message = "El score financiero excede el máximo permitido")
    @Column(name = "score_financiero", precision = 5, scale = 2)
    private BigDecimal scoreFinanciero;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_riesgo")
    private NivelRiesgo nivelRiesgo;

}
