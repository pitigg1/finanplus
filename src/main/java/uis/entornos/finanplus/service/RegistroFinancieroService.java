package uis.entornos.finanplus.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.RegistroFinanciero;
import uis.entornos.finanplus.repository.RegistroFinancieroRepository;

@Service
@RequiredArgsConstructor
public class RegistroFinancieroService implements IRegistroFinancieroService{
	private final RegistroFinancieroRepository repository;

    @Override
    public List<RegistroFinanciero> findAllByUsuario(String idUsuario) {
        return repository.findByUsuarioIdUsuario(idUsuario);
    }

    @Override
    public RegistroFinanciero findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Registro no encontrado"));
    }

    @Override
    @Transactional
    public RegistroFinanciero save(RegistroFinanciero registro) { return repository.save(registro); }

    @Override
    @Transactional
    public RegistroFinanciero update(String id, RegistroFinanciero registro) {
        RegistroFinanciero existente = findById(id);
        existente.setCategoria(registro.getCategoria());
        existente.setTipoMovimiento(registro.getTipoMovimiento());
        existente.setMonto(registro.getMonto());
        existente.setDescripcion(registro.getDescripcion());
        existente.setFechaMovimiento(registro.getFechaMovimiento());
        existente.setEsRecurrente(registro.getEsRecurrente());
        return repository.save(existente);
    }

    @Override
    @Transactional
    public void delete(String id) { repository.deleteById(id); }
}
