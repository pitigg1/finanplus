package uis.entornos.finanplus.repository;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.entornos.finanplus.model.MovimientoRecurrente;

@Repository
public interface MovimientoRecurrenteRepository extends JpaRepository<MovimientoRecurrente, String> {
    List<MovimientoRecurrente> findByUsuarioIdUsuario(String idUsuario);

    boolean existsByCategoriaIdCategoria(Integer idCategoria);

    // Recurrentes activos cuya fecha ya llegó (la usa la tarea que los registra automáticamente)
    List<MovimientoRecurrente> findByActivoTrueAndProximaFechaLessThanEqual(LocalDate fecha);

    List<MovimientoRecurrente> findByActivoTrueAndProximaFechaLessThanEqualAndUsuarioCorreo(LocalDate fecha, String correo);
}