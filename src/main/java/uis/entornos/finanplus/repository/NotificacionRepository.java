package uis.entornos.finanplus.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.entornos.finanplus.model.Notificacion;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, String> {
	List<Notificacion> findByUsuarioIdUsuario(String idUsuario);

}
