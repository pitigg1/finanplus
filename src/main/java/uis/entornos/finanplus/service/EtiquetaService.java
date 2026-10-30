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
    private final uis.entornos.finanplus.security.SeguridadService seguridad;

    @Override
    public List<Etiqueta> findAll() { return repository.findByUsuarioIsNullOrUsuarioIdUsuario(seguridad.idActual()); }

    @Override
    public Etiqueta findById(Integer id) {
        Etiqueta etiqueta = repository.findById(id).orElseThrow(() -> new RuntimeException("Etiqueta no encontrada"));
        if (!seguridad.esAdmin()) seguridad.exigirEtiquetaVisible(etiqueta);
        return etiqueta;
    }

    @Override
    @Transactional
    public Etiqueta save(Etiqueta etiqueta) {
        if (repository.existsByNombreAndUsuarioIdUsuario(etiqueta.getNombre(), seguridad.idActual())) {
            throw new RuntimeException("Ya existe una etiqueta con ese nombre");
        }
        etiqueta.setIdEtiqueta(null);                          // nunca se pisa una etiqueta existente
        etiqueta.setUsuario(seguridad.referenciaActual());     // el dueño es quien la crea, no lo que mande el cliente
        return repository.save(etiqueta);
    }

    @Override
    @Transactional
    public Etiqueta update(Integer id, Etiqueta etiqueta) {
        Etiqueta existente = findById(id);
        seguridad.exigirPuedeEditar(existente.getUsuario(), "etiqueta");
        existente.setNombre(etiqueta.getNombre());
        return repository.save(existente);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        Etiqueta existente = findById(id);
        seguridad.exigirPuedeEditar(existente.getUsuario(), "etiqueta");
        repository.delete(existente);
    }
}
