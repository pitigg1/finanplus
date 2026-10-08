package uis.entornos.finanplus.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uis.entornos.finanplus.dto.RegistroFinancieroRequestDTO;
import uis.entornos.finanplus.dto.RegistroFinancieroResponseDTO;
import uis.entornos.finanplus.enums.TipoMovimiento;
import uis.entornos.finanplus.model.Categoria;
import uis.entornos.finanplus.model.Etiqueta;
import uis.entornos.finanplus.model.RegistroFinanciero;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.CategoriaRepository;
import uis.entornos.finanplus.repository.EtiquetaRepository;
import uis.entornos.finanplus.repository.RegistroFinancieroRepository;
import uis.entornos.finanplus.repository.UsuarioRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegistroFinancieroService implements IRegistroFinancieroService {

    private final RegistroFinancieroRepository registroRepository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final EtiquetaRepository etiquetaRepository; // Inyección añadida

    @Override
    @Transactional
    public RegistroFinancieroResponseDTO crear(RegistroFinancieroRequestDTO request, String correoUsuario) {
        Usuario usuario = usuarioRepository.findByCorreo(correoUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con correo: " + correoUsuario));

        Categoria categoria = categoriaRepository.findById(request.getIdCategoria())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: " + request.getIdCategoria()));

        TipoMovimiento tipoMovimiento;
        try {
            tipoMovimiento = TipoMovimiento.valueOf(request.getTipoMovimiento().toUpperCase());
        } catch (Exception e) {
            tipoMovimiento = TipoMovimiento.GASTO;
        }

        // Cargar etiquetas enviadas en la petición
        Set<Etiqueta> etiquetas = new HashSet<>();
        if (request.getIdsEtiquetas() != null && !request.getIdsEtiquetas().isEmpty()) {
            etiquetas = new HashSet<>(etiquetaRepository.findAllById(request.getIdsEtiquetas()));
        }

        RegistroFinanciero registro = RegistroFinanciero.builder()
                .usuario(usuario)
                .categoria(categoria)
                .tipoMovimiento(tipoMovimiento)
                .monto(request.getMonto())
                .descripcion(request.getDescripcion())
                .fechaMovimiento(request.getFechaMovimiento())
                .esRecurrente(Boolean.TRUE.equals(request.getEsRecurrente()))
                .etiquetas(etiquetas)
                .build();

        RegistroFinanciero guardado = registroRepository.save(registro);
        return mapearAResponseDTO(guardado);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistroFinancieroResponseDTO> listarPorUsuario(String correoUsuario) {
        return registroRepository.findByUsuarioCorreo(correoUsuario).stream()
                .map(this::mapearAResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RegistroFinancieroResponseDTO obtenerPorId(String id) {
        RegistroFinanciero registro = registroRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro financiero no encontrado con ID: " + id));
        return mapearAResponseDTO(registro);
    }

    @Override
    @Transactional
    public void eliminar(String id, String correoUsuario) {
        RegistroFinanciero registro = registroRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro financiero no encontrado"));
        if (!registro.getUsuario().getCorreo().equalsIgnoreCase(correoUsuario)) {
            throw new RuntimeException("No tiene permisos para eliminar este registro");
        }
        registroRepository.deleteById(id);
    }

    @Override
    @Transactional
    public RegistroFinancieroResponseDTO actualizar(String id, RegistroFinancieroRequestDTO request, String correoUsuario) {
        RegistroFinanciero registroExistente = registroRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro financiero no encontrado con ID: " + id));

        if (!registroExistente.getUsuario().getCorreo().equalsIgnoreCase(correoUsuario)) {
            throw new RuntimeException("No tiene permisos para modificar este registro");
        }

        Categoria categoria = categoriaRepository.findById(request.getIdCategoria())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: " + request.getIdCategoria()));

        TipoMovimiento tipoMovimiento;
        try {
            tipoMovimiento = TipoMovimiento.valueOf(request.getTipoMovimiento().toUpperCase());
        } catch (Exception e) {
            tipoMovimiento = TipoMovimiento.GASTO;
        }

        // Actualizar datos básicos
        registroExistente.setCategoria(categoria);
        registroExistente.setTipoMovimiento(tipoMovimiento);
        registroExistente.setMonto(request.getMonto());
        registroExistente.setDescripcion(request.getDescripcion());
        registroExistente.setFechaMovimiento(request.getFechaMovimiento());
        registroExistente.setEsRecurrente(Boolean.TRUE.equals(request.getEsRecurrente()));

        // Actualizar colección de etiquetas
        if (request.getIdsEtiquetas() != null) {
            Set<Etiqueta> nuevasEtiquetas = new HashSet<>(etiquetaRepository.findAllById(request.getIdsEtiquetas()));
            registroExistente.setEtiquetas(nuevasEtiquetas);
        }

        RegistroFinanciero actualizado = registroRepository.save(registroExistente);
        return mapearAResponseDTO(actualizado);
    }

    private RegistroFinancieroResponseDTO mapearAResponseDTO(RegistroFinanciero registro) {
        // Extraer nombres o IDs de etiquetas para la respuesta
        Set<String> nombresEtiquetas = registro.getEtiquetas() != null
                ? registro.getEtiquetas().stream().map(Etiqueta::getNombre).collect(Collectors.toSet())
                : new HashSet<>();

        return RegistroFinancieroResponseDTO.builder()
                .idRegistro(registro.getIdRegistro())
                .idUsuario(registro.getUsuario().getIdUsuario())
                .idCategoria(registro.getCategoria().getIdCategoria())
                .nombreCategoria(registro.getCategoria().getNombre())
                .tipoMovimiento(registro.getTipoMovimiento() != null ? registro.getTipoMovimiento().name() : null)
                .monto(registro.getMonto())
                .descripcion(registro.getDescripcion())
                .fechaMovimiento(registro.getFechaMovimiento())
                .esRecurrente(registro.getEsRecurrente())
                .etiquetas(nombresEtiquetas) // Inclusión en la respuesta DTO
                .build();
    }
}