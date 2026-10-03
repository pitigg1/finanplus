package uis.entornos.finanplus.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.entornos.finanplus.model.MetaAhorro;

import java.util.List;

@Repository
public interface MetaAhorroRepository extends JpaRepository<MetaAhorro, String> {
    List<MetaAhorro> findByUsuarioIdUsuario(String idUsuario);
}
