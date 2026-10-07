package uis.entornos.finanplus.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.entornos.finanplus.model.MetricaFinanciera;

@Repository
public interface MetricaFinancieraRepository extends JpaRepository<MetricaFinanciera, String> {
	List<MetricaFinanciera> findByUsuarioIdUsuario(String idUsuario);
}
