package uis.entornos.finanplus.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

/**
 * Enlace de un solo uso para restablecer la contraseña. En la base de datos se guarda solo el HASH del
 * token (SHA-256), nunca el token: si alguien viera la tabla, no podría usar ningún enlace.
 */
@Entity
@Table(name = "Tokens_Recuperacion")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TokenRecuperacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_token", columnDefinition = "CHAR(36)")
    private String idToken;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Usuario usuario;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private LocalDateTime expira;

    @Builder.Default
    @Column(nullable = false)
    private Boolean usado = false;

    private LocalDateTime creado;

    @PrePersist
    protected void alCrear() {
        this.creado = LocalDateTime.now();
    }
}
