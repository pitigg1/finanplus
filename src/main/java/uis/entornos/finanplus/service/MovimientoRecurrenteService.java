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
    private final CategoriaRepository categoriaRepository;
    private final uis.entornos.finanplus.security.SeguridadService seguridad;

    @Override
    @Transactional(readOnly = true)
    public List<MovimientoRecurrente> findAllByUsuario(String idUsuario) {
        seguridad.exigirPropio(idUsuario);
        return repository.findByUsuarioIdUsuario(idUsuario);
    }

    @Override
    @Transactional(readOnly = true)
    public MovimientoRecurrente findById(String id) {
        MovimientoRecurrente m = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movimiento recurrente no encontrado"));
        seguridad.exigirDueno(m.getUsuario());
        return m;
    }

    @Override
    @Transactional
    public MovimientoRecurrente save(MovimientoRecurrente m) {
        Categoria categoria = categoriaRepository.findById(m.getCategoria().getIdCategoria())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
        seguridad.exigirCategoriaVisible(categoria);

        m.setIdRecurrencia(null);                       // nunca se pisa un recurrente que ya existe
        m.setUsuario(seguridad.referenciaActual());     // el dueño es quien lo crea, no lo que mande el cliente
        m.setCategoria(categoria);
        m.setTipoMovimiento(TipoDeCategoria.resolver(categoria, m.getTipoMovimiento())); // = tipo de la categoría
        return repository.save(m);
    }

    @Override
    @Transactional
    public MovimientoRecurrente update(String id, MovimientoRecurrente m) {
        MovimientoRecurrente existente = findById(id);

        Categoria categoria = categoriaRepository.findById(m.getCategoria().getIdCategoria())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
        seguridad.exigirCategoriaVisible(categoria);

        existente.setNombre(m.getNombre());
        existente.setCategoria(categoria);
        existente.setTipoMovimiento(TipoDeCategoria.resolver(categoria, m.getTipoMovimiento())); // = tipo de la categoría
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
