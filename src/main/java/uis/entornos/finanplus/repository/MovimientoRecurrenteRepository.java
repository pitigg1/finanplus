package uis.entornos.finanplus.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.entornos.finanplus.model.MovimientoRecurrente;

@Repository
public interface MovimientoRecurrenteRepository extends JpaRepository<MovimientoRecurrente, String> {
    List<MovimientoRecurrente> findByUsuarioIdUsuario(String idUsuario);
}