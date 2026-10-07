package uis.entornos.finanplus.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import uis.entornos.finanplus.enums.NivelPrioridad;
import uis.entornos.finanplus.enums.TipoAlerta;

@Entity
@Table(name = "Notificaciones")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Notificacion {
	
	@Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_notificacion", columnDefinition = "CHAR(36)")
    private String idNotificacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "password"})
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_alerta", nullable = false)
    private TipoAlerta tipoAlerta;

    @NotBlank(message = "El título es obligatorio")
    @Size(max = 200)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mensaje;

    @Column(name = "id_referencia", columnDefinition = "CHAR(36)")
    private String idReferencia;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_prioridad")
    @Builder.Default
    private NivelPrioridad nivelPrioridad = NivelPrioridad.MEDIA;

    @Builder.Default
    private Boolean leida = false;

    @Column(name = "fecha_generacion", updatable = false)
    private LocalDateTime fechaGeneracion;

    @PrePersist
    protected void onCreate() {
        if (this.fechaGeneracion == null) this.fechaGeneracion = LocalDateTime.now();
    }

    @Column(name = "fecha_lectura")
    private LocalDateTime fechaLectura;

}
