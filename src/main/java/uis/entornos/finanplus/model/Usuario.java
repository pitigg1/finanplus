package uis.entornos.finanplus.model;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.userdetails.UserDetails;

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
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import com.fasterxml.jackson.annotation.JsonIgnore;
import uis.entornos.finanplus.enums.EstadoUsuario;
import uis.entornos.finanplus.enums.Rol;

@Entity
@Table(name = "Usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario implements UserDetails{

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
	@JsonIgnore
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

	// Cada token de sesión lleva esta versión. Al restablecer la contraseña sube en 1 y los tokens anteriores dejan de servir.
	@JsonIgnore
	@Column(name = "sesion_version")
	@Builder.Default
	private Integer sesionVersion = 0;

	// USUARIO (por defecto) o ADMIN. Los usuarios antiguos sin rol se tratan como USUARIO.
	@Enumerated(EnumType.STRING)
	@Builder.Default
	private Rol rol = Rol.USUARIO;

	@PrePersist
	protected void onCreate() {
		this.fechaRegistro = LocalDateTime.now();
	}
	
	// (no es un "getter": no sale en el JSON) las cuentas antiguas sin versión cuentan como 0
	public int versionDeSesion() {
		return sesionVersion == null ? 0 : sesionVersion;
	}

	// --- Métodos requeridos por UserDetails ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + (rol != null ? rol : Rol.USUARIO).name()));
    }

    @Override
    public String getPassword() {
        return this.passwordHash;
    }

    @Override
    public String getUsername() {
        return this.correo;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return this.estado == EstadoUsuario.ACTIVO;
    }
}
