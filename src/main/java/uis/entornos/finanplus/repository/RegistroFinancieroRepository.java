package uis.entornos.finanplus.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uis.entornos.finanplus.enums.TipoMovimiento;
import uis.entornos.finanplus.model.RegistroFinanciero;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface RegistroFinancieroRepository extends JpaRepository<RegistroFinanciero, String> {
    List<RegistroFinanciero> findByUsuarioCorreo(String correo);

    // Suma lo que un usuario registró de un tipo (ej. GASTO) en una categoría durante un mes y año
    @Query("""
            SELECT COALESCE(SUM(r.monto), 0) FROM RegistroFinanciero r
            WHERE r.usuario.idUsuario = :idUsuario
              AND r.categoria.idCategoria = :idCategoria
              AND r.tipoMovimiento = :tipo
              AND EXTRACT(YEAR FROM r.fechaMovimiento) = :anio
              AND EXTRACT(MONTH FROM r.fechaMovimiento) = :mes
            """)
    BigDecimal sumarPorCategoriaYMes(@Param("idUsuario") String idUsuario,
                                     @Param("idCategoria") Integer idCategoria,
                                     @Param("tipo") TipoMovimiento tipo,
                                     @Param("mes") Integer mes,
                                     @Param("anio") Integer anio);
}