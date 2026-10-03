package uis.entornos.finanplus.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Categoria;
import uis.entornos.finanplus.model.MovimientoRecurrente;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.CategoriaRepository;
import uis.entornos.finanplus.repository.MovimientoRecurrenteRepository;
import uis.entornos.finanplus.repository.UsuarioRepository;

@Service
@RequiredArgsConstructor
public class MovimientoRecurrenteService implements IMovimientoRecurrenteService {

    private final MovimientoRecurrenteRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MovimientoRecurrente> findAllByUsuario(String idUsuario) {
        return repository.findByUsuarioIdUsuario(idUsuario);
    }

    @Override
    @Transactional(readOnly = true)
    public MovimientoRecurrente findById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movimiento recurrente no encontrado"));
    }

    @Override
    @Transactional
    public MovimientoRecurrente save(MovimientoRecurrente m) {
        Usuario usuario = usuarioRepository.findById(m.getUsuario().getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Categoria categoria = categoriaRepository.findById(m.getCategoria().getIdCategoria())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        m.setUsuario(usuario);
        m.setCategoria(categoria);
        return repository.save(m);
    }

    @Override
    @Transactional
    public MovimientoRecurrente update(String id, MovimientoRecurrente m) {
        MovimientoRecurrente existente = findById(id);

        Categoria categoria = categoriaRepository.findById(m.getCategoria().getIdCategoria())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        existente.setCategoria(categoria);
        existente.setTipoMovimiento(m.getTipoMovimiento());
        existente.setMontoEstimado(m.getMontoEstimado());
        existente.setFrecuencia(m.getFrecuencia());
        existente.setProximaFecha(m.getProximaFecha());
        if (m.getActivo() != null) existente.setActivo(m.getActivo());
        return repository.save(existente);
    }

    @Override
    @Transactional
    public void delete(String id) {
        repository.delete(findById(id));   
    }
}