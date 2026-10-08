package uis.entornos.finanplus.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uis.entornos.finanplus.model.Presupuesto;

import java.util.List;

@Repository
public interface PresupuestoRepository extends JpaRepository<Presupuesto, String> {
    List<Presupuesto> findByUsuarioCorreo(String correo);
}