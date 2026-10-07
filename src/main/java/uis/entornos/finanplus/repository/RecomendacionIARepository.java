package uis.entornos.finanplus.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.entornos.finanplus.model.RecomendacionIA;

@Repository
public interface RecomendacionIARepository extends JpaRepository<RecomendacionIA, String> {
	List<RecomendacionIA> findByUsuarioIdUsuario(String idUsuario);

}
