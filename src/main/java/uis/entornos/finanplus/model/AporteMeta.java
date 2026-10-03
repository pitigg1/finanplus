package uis.entornos.finanplus.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "Aportes_Meta")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AporteMeta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_aporte", columnDefinition = "CHAR(36)")
    private String idAporte;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_meta", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "usuario"})
    private MetaAhorro meta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_registro", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "usuario", "categoria"})
    private RegistroFinanciero registro;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
    private BigDecimal monto;

    @Column(name = "fecha_aporte")
    private LocalDateTime fechaAporte;

    @PrePersist
    protected void onCreate() {
        if (this.fechaAporte == null) this.fechaAporte = LocalDateTime.now();
    }
}
