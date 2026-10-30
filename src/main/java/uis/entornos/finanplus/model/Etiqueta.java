package uis.entornos.finanplus.model;

import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Etiquetas", uniqueConstraints = @UniqueConstraint(name = "uk_etiqueta_usuario_nombre", columnNames = {"nombre", "id_usuario"}))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Etiqueta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_etiqueta")
    private Integer idEtiqueta;

    @Column(nullable = false, length = 100)
    private String nombre;

    // Dueño de la etiqueta (null = general, solo la cambia un administrador). El nombre es único por usuario.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Usuario usuario;

    @ManyToMany(mappedBy = "etiquetas", fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<RegistroFinanciero> registros = new HashSet<>();
}
