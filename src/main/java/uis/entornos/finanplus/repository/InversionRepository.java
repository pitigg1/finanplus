package uis.entornos.finanplus.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.entornos.finanplus.model.Inversion;

@Repository
public interface InversionRepository extends JpaRepository<Inversion, String> {
	List<Inversion> findByUsuarioIdUsuario(String idUsuario);

}
