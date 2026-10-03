package uis.entornos.finanplus.service;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Categoria;
import uis.entornos.finanplus.repository.CategoriaRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaService implements ICategoriaService {

    private final CategoriaRepository repository;

    @Override
    public List<Categoria> findAll() { return repository.findAll(); }

    @Override
    public Categoria findById(Integer id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
    }

    @Override
    @Transactional
    public Categoria save(Categoria categoria) {
    	return repository.save(categoria);
    }

    @Override
    @Transactional
    public Categoria update(Integer id, Categoria categoria) {
        Categoria existente = findById(id);
        existente.setNombre(categoria.getNombre());
        existente.setTipo(categoria.getTipo());
        existente.setIcono(categoria.getIcono());
        existente.setColor(categoria.getColor());
        return repository.save(existente);
    }

    @Override
    @Transactional
    public void delete(Integer id) { repository.deleteById(id); }
}