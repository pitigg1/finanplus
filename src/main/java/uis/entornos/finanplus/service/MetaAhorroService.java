package uis.entornos.finanplus.service;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.MetaAhorro;
import uis.entornos.finanplus.repository.MetaAhorroRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MetaAhorroService implements IMetaAhorroService{
	private final MetaAhorroRepository repository;

    @Override
    public List<MetaAhorro> findAllByUsuario(String idUsuario) {
        return repository.findByUsuarioIdUsuario(idUsuario);
    }

    @Override
    public MetaAhorro findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Meta de ahorro no encontrada"));
    }

    @Override
    @Transactional
    public MetaAhorro save(MetaAhorro meta) { return repository.save(meta); }

    @Override
    @Transactional
    public MetaAhorro update(String id, MetaAhorro meta) {
        MetaAhorro existente = findById(id);
        existente.setNombre(meta.getNombre());
        existente.setDescripcion(meta.getDescripcion());
        existente.setMontoObjetivo(meta.getMontoObjetivo());
        existente.setMontoActual(meta.getMontoActual());
        existente.setFechaObjetivo(meta.getFechaObjetivo());
        existente.setPrioridad(meta.getPrioridad());
        existente.setEstado(meta.getEstado());
        return repository.save(existente);
    }

    @Override
    @Transactional
    public void delete(String id) { repository.deleteById(id); }

}
