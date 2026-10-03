package uis.entornos.finanplus.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.entornos.finanplus.model.Presupuesto;

@Repository
public interface PresupuestoRepository extends JpaRepository<Presupuesto, String> {
    List<Presupuesto> findByUsuarioIdUsuario(String idUsuario);

    boolean existsByUsuarioIdUsuarioAndCategoriaIdCategoriaAndMesAndAnio(
            String idUsuario, Integer idCategoria, Integer mes, Integer anio);
}
