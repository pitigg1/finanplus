package uis.entornos.finanplus.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uis.entornos.finanplus.model.TokenRecuperacion;

@Repository
public interface TokenRecuperacionRepository extends JpaRepository<TokenRecuperacion, String> {

    Optional<TokenRecuperacion> findByTokenHash(String tokenHash);

    List<TokenRecuperacion> findByUsuarioIdUsuarioAndUsadoFalse(String idUsuario);

    Optional<TokenRecuperacion> findFirstByUsuarioIdUsuarioOrderByCreadoDesc(String idUsuario);
}
