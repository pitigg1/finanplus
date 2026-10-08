package uis.entornos.finanplus.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import uis.entornos.finanplus.dto.CategoriaRequestDTO;
import uis.entornos.finanplus.dto.CategoriaResponseDTO;
import uis.entornos.finanplus.enums.TipoMovimiento;
import uis.entornos.finanplus.model.Categoria;
import uis.entornos.finanplus.repository.CategoriaRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoriaService implements ICategoriaService {

    private final CategoriaRepository categoriaRepository;
    
    @Override
    public CategoriaResponseDTO crear(CategoriaRequestDTO dto) {
        Categoria categoria = Categoria.builder()
                .nombre(dto.getNombre())
                .tipo(TipoMovimiento.valueOf(dto.getTipo().toUpperCase())) // Convierte "INGRESO"/"GASTO" al Enum
                .icono(dto.getIcono())
                .color(dto.getColor())
                .build();

        Categoria guardada = categoriaRepository.save(categoria);
        return mapearAResponseDTO(guardada);
    }

    @Override
    public List<CategoriaResponseDTO> listarTodas() {
        return categoriaRepository.findAll().stream()
                .map(this::mapearAResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CategoriaResponseDTO obtenerPorId(Integer id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
        return mapearAResponseDTO(categoria);
    }

    private CategoriaResponseDTO mapearAResponseDTO(Categoria categoria) {
        return CategoriaResponseDTO.builder()
                .idCategoria(categoria.getIdCategoria())
                .nombre(categoria.getNombre())
                .tipo(categoria.getTipo().name())
                .icono(categoria.getIcono())
                .color(categoria.getColor())
                .build();
    }
    
    @Override
    public CategoriaResponseDTO actualizar(Integer id, CategoriaRequestDTO dto) {
        Categoria categoriaExistente = categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: " + id));

        categoriaExistente.setNombre(dto.getNombre());
        categoriaExistente.setTipo(TipoMovimiento.valueOf(dto.getTipo().toUpperCase()));
        categoriaExistente.setIcono(dto.getIcono());
        categoriaExistente.setColor(dto.getColor());

        Categoria actualizada = categoriaRepository.save(categoriaExistente);
        return mapearAResponseDTO(actualizada);
    }
    
    @Override
    public void eliminar(Integer id) {
        if (!categoriaRepository.existsById(id)) {
            throw new RuntimeException("Categoría no encontrada con ID: " + id);
        }
        categoriaRepository.deleteById(id);
    }
}