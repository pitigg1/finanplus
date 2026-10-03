package uis.entornos.finanplus.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.entornos.finanplus.model.AporteMeta;

@Repository
public interface AporteMetaRepository extends JpaRepository<AporteMeta, String> {
    List<AporteMeta> findByMetaIdMeta(String idMeta);
}
