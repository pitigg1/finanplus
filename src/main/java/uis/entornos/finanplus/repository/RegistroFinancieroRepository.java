package uis.entornos.finanplus.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.entornos.finanplus.model.RegistroFinanciero;

import java.util.List;

@Repository
public interface RegistroFinancieroRepository extends JpaRepository<RegistroFinanciero, String> {
    List<RegistroFinanciero> findByUsuarioIdUsuario(String idUsuario);
}