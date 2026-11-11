package uis.entornos.finanplus.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import uis.entornos.finanplus.dto.CategoriaRequestDTO;
import uis.entornos.finanplus.dto.CategoriaResponseDTO;
import uis.entornos.finanplus.enums.TipoMovimiento;
import uis.entornos.finanplus.model.Categoria;
import uis.entornos.finanplus.repository.CategoriaRepository;
import uis.entornos.finanplus.repository.MovimientoRecurrenteRepository;
import uis.entornos.finanplus.repository.RegistroFinancieroRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoriaService implements ICategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final RegistroFinancieroRepository registroRepository;
    private final MovimientoRecurrenteRepository recurrenteRepository;
    private final uis.entornos.finanplus.security.SeguridadService seguridad;
    
    @Override
    public CategoriaResponseDTO crear(CategoriaRequestDTO dto) {
        Categoria categoria = Categoria.builder()
                .nombre(dto.getNombre())
                .tipo(parsearTipo(dto.getTipo())) // Convierte "INGRESO"/"GASTO"... al Enum
                .icono(dto.getIcono())
                .color(dto.getColor())
                .usuario(seguridad.referenciaActual())
                .build();

        Categoria guardada = categoriaRepository.save(categoria);
        return mapearAResponseDTO(guardada);
    }

    @Override
    public List<CategoriaResponseDTO> listarTodas() {
        return categoriaRepository.findByUsuarioIsNullOrUsuarioIdUsuario(seguridad.idActual()).stream()
                .map(this::mapearAResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CategoriaResponseDTO obtenerPorId(Integer id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
        if (!seguridad.esAdmin()) seguridad.exigirCategoriaVisible(categoria);
        return mapearAResponseDTO(categoria);
    }

    private static TipoMovimiento parsearTipo(String texto) {
        try {
            return TipoMovimiento.valueOf(texto.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new RuntimeException("Tipo de categoría no válido: " + texto + " (use INGRESO, GASTO, AHORRO o INVERSION)");
        }
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

        seguridad.exigirPuedeEditar(categoriaExistente.getUsuario(), "categoría");
        categoriaExistente.setNombre(dto.getNombre());
        TipoMovimiento nuevoTipo = parsearTipo(dto.getTipo());
        // Los movimientos ya guardados tienen el tipo de su categoría: cambiarlo dejaría datos incoherentes.
        if (nuevoTipo != categoriaExistente.getTipo()
                && (registroRepository.existsByCategoriaIdCategoria(id)
                    || recurrenteRepository.existsByCategoriaIdCategoria(id))) {
            throw new RuntimeException("No se puede cambiar el tipo de una categoría que ya tiene registros o movimientos recurrentes");
        }
        categoriaExistente.setTipo(nuevoTipo);
        categoriaExistente.setIcono(dto.getIcono());
        categoriaExistente.setColor(dto.getColor());

        Categoria actualizada = categoriaRepository.save(categoriaExistente);
        return mapearAResponseDTO(actualizada);
    }
    
    @Override
    public void eliminar(Integer id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: " + id));
        seguridad.exigirPuedeEditar(categoria.getUsuario(), "categoría");
        categoriaRepository.delete(categoria);
    }
}