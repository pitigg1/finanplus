package uis.entornos.finanplus.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import uis.entornos.finanplus.enums.NivelPrioridad;

@Entity
@Table(name = "Recomendaciones_IA")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RecomendacionIA {
	
	@Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_recomendacion", columnDefinition = "CHAR(36)")
    private String idRecomendacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "password"})
    private Usuario usuario;

    @Size(max = 100)
    @Column(name = "tipo_recomendacion", nullable = false)
    private String tipoRecomendacion;

    @NotBlank(message = "El título es obligatorio")
    @Size(max = 200)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_prioridad")
    @Builder.Default
    private NivelPrioridad nivelPrioridad = NivelPrioridad.MEDIA;

    @Column(name = "fecha_generacion")
    private LocalDateTime fechaGeneracion;

    @PrePersist
    protected void onCreate() {
        if (this.fechaGeneracion == null) this.fechaGeneracion = LocalDateTime.now();
    }

    @Size(max = 100)
    @Column(name = "modelo_utilizado")
    private String modeloUtilizado;

    @DecimalMin(value = "0.00", message = "El score de confianza debe ser mínimo 0")
    @DecimalMax(value = "100.00", message = "El score de confianza debe ser máximo 100")
    @Column(name = "score_confianza", precision = 5, scale = 2)
    private BigDecimal scoreConfianza;

    @Column(name = "fue_aplicada")
    @Builder.Default
    private Boolean fueAplicada = false;

}
