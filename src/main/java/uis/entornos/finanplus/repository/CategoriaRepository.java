package uis.entornos.finanplus.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.entornos.finanplus.model.Categoria;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {
    // las generales (sin dueño) y las del usuario
    java.util.List<Categoria> findByUsuarioIsNullOrUsuarioIdUsuario(String idUsuario);

    java.util.List<Categoria> findByUsuarioIdUsuario(String idUsuario);
}