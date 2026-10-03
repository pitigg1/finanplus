package uis.entornos.finanplus.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Presupuesto;
import uis.entornos.finanplus.repository.PresupuestoRepository;

@Service
@RequiredArgsConstructor
public class PresupuestoService implements IPresupuestoService {

    private final PresupuestoRepository repository;

    @Override
    public List<Presupuesto> findAllByUsuario(String idUsuario) {
        return repository.findByUsuarioIdUsuario(idUsuario);
    }

    @Override
    public Presupuesto findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Presupuesto no encontrado"));
    }

    @Override
    @Transactional
    public Presupuesto save(Presupuesto p) {
        boolean duplicado = repository.existsByUsuarioIdUsuarioAndCategoriaIdCategoriaAndMesAndAnio(
                p.getUsuario().getIdUsuario(), p.getCategoria().getIdCategoria(), p.getMes(), p.getAnio());
        if (duplicado) {
            throw new RuntimeException("Ya existe un presupuesto para esa categoría en ese mes y año");
        }
        return repository.save(p);
    }

    @Override
    @Transactional
    public Presupuesto update(String id, Presupuesto p) {
        Presupuesto existente = findById(id);
        existente.setCategoria(p.getCategoria());
        existente.setMes(p.getMes());
        existente.setAnio(p.getAnio());
        existente.setLimiteGasto(p.getLimiteGasto());
        existente.setGastoActual(p.getGastoActual());
        return repository.save(existente);
    }

    @Override
    @Transactional
    public void delete(String id) { repository.deleteById(id); }
}
