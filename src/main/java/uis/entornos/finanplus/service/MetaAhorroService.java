package uis.entornos.finanplus.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.enums.EstadoMeta;
import uis.entornos.finanplus.model.MetaAhorro;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.MetaAhorroRepository;
import uis.entornos.finanplus.repository.UsuarioRepository;

@Service
@RequiredArgsConstructor
public class MetaAhorroService implements IMetaAhorroService {

    private final MetaAhorroRepository repository;
    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MetaAhorro> findAllByUsuario(String idUsuario) {
        return repository.findByUsuarioIdUsuario(idUsuario);
    }

    @Override
    @Transactional(readOnly = true)
    public MetaAhorro findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Meta de ahorro no encontrada"));
    }

    @Override
    @Transactional
    public MetaAhorro save(MetaAhorro meta) {
        Usuario usuario = usuarioRepository.findById(meta.getUsuario().getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        meta.setUsuario(usuario);
        meta.setMontoActual(BigDecimal.ZERO);
        meta.setEstado(EstadoMeta.ACTIVA);
        return repository.save(meta);
    }

    @Override
    @Transactional
    public MetaAhorro update(String id, MetaAhorro meta) {
        MetaAhorro existente = findById(id);
        existente.setNombre(meta.getNombre());
        existente.setDescripcion(meta.getDescripcion());
        existente.setMontoObjetivo(meta.getMontoObjetivo());
        existente.setFechaObjetivo(meta.getFechaObjetivo());
        existente.setPrioridad(meta.getPrioridad());
        if (meta.getEstado() != null) existente.setEstado(meta.getEstado());
        return repository.save(existente);
    }

    @Override
    @Transactional
    public void delete(String id) {
        repository.delete(findById(id));
    }
}
