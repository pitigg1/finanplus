package uis.entornos.finanplus.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uis.entornos.finanplus.enums.EstadoUsuario;

@Entity
@Table(name = "Usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(name = "id_usuario", columnDefinition = "CHAR(36)")
	private String idUsuario;

	@NotBlank(message = "El nombre no puede estar vacío")
	@Size(max = 100)
	private String nombre;

	@NotBlank(message = "El correo es obligatorio")
	@Email(message = "Formato de correo inválido")
	@Column(unique = true, length = 150)
	private String correo;

	@NotBlank(message = "La contraseña es obligatoria")
	@Column(name = "password_hash")
	private String passwordHash;

	@Column(name = "fecha_registro", updatable = false)
	private LocalDateTime fechaRegistro;

	@Size(max = 10)
	@Column(name = "moneda_preferida")
	@Builder.Default
	private String monedaPreferida = "COP";

	@Size(max = 80)
	private String pais;

	@Column(name = "foto_perfil")
	private String fotoPerfil;

	@Enumerated(EnumType.STRING)
	@Builder.Default
	private EstadoUsuario estado = EstadoUsuario.ACTIVO;

	@PrePersist
	protected void onCreate() {
		this.fechaRegistro = LocalDateTime.now();
	}
}
