package uis.entornos.finanplus.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Etiqueta;
import uis.entornos.finanplus.repository.EtiquetaRepository;

@Service
@RequiredArgsConstructor
public class EtiquetaService implements IEtiquetaService {

    private final EtiquetaRepository repository;

    @Override
    public List<Etiqueta> findAll() { return repository.findAll(); }

    @Override
    public Etiqueta findById(Integer id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Etiqueta no encontrada"));
    }

    @Override
    @Transactional
    public Etiqueta save(Etiqueta etiqueta) {
        if (repository.existsByNombre(etiqueta.getNombre())) {
            throw new RuntimeException("Ya existe una etiqueta con ese nombre");
        }
        return repository.save(etiqueta);
    }

    @Override
    @Transactional
    public Etiqueta update(Integer id, Etiqueta etiqueta) {
        Etiqueta existente = findById(id);
        existente.setNombre(etiqueta.getNombre());
        return repository.save(existente);
    }

    @Override
    @Transactional
    public void delete(Integer id) { repository.deleteById(id); }
}
