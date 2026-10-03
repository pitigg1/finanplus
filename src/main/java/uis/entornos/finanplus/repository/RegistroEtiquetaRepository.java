package uis.entornos.finanplus.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.entornos.finanplus.model.RegistroEtiqueta;
import uis.entornos.finanplus.model.RegistroEtiquetaId;

@Repository
public interface RegistroEtiquetaRepository extends JpaRepository<RegistroEtiqueta, RegistroEtiquetaId> {
    List<RegistroEtiqueta> findByIdIdRegistro(String idRegistro);
    List<RegistroEtiqueta> findByIdIdEtiqueta(Integer idEtiqueta);
}
