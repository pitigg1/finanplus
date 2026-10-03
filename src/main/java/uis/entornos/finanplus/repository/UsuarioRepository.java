package uis.entornos.finanplus.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.entornos.finanplus.model.Usuario;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, String>{
	boolean existsByCorreo(String correo);
	Optional<Usuario> findByCorreo(String correo);
}
