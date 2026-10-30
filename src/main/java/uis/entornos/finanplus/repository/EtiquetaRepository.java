package uis.entornos.finanplus.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.entornos.finanplus.model.Etiqueta;

@Repository
public interface EtiquetaRepository extends JpaRepository<Etiqueta, Integer> {
    java.util.List<Etiqueta> findByUsuarioIsNullOrUsuarioIdUsuario(String idUsuario);

    java.util.List<Etiqueta> findByUsuarioIdUsuario(String idUsuario);

    boolean existsByNombreAndUsuarioIdUsuario(String nombre, String idUsuario);
}
