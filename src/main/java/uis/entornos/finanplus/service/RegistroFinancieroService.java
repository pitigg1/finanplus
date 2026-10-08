package uis.entornos.finanplus.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import uis.entornos.finanplus.dto.RegistroFinancieroRequestDTO;
import uis.entornos.finanplus.dto.RegistroFinancieroResponseDTO;
import uis.entornos.finanplus.enums.TipoMovimiento;
import uis.entornos.finanplus.model.Categoria;
import uis.entornos.finanplus.model.RegistroFinanciero;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.CategoriaRepository;
import uis.entornos.finanplus.repository.RegistroFinancieroRepository;
import uis.entornos.finanplus.repository.UsuarioRepository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegistroFinancieroService implements IRegistroFinancieroService {

    private final RegistroFinancieroRepository registroRepository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;

    @Override
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

        RegistroFinanciero registro = RegistroFinanciero.builder()
                .usuario(usuario)
                .categoria(categoria)
                .tipoMovimiento(tipoMovimiento)
                .monto(request.getMonto())
                .descripcion(request.getDescripcion())
                .fechaMovimiento(request.getFechaMovimiento())
                .esRecurrente(Boolean.TRUE.equals(request.getEsRecurrente()))
                .build();

        RegistroFinanciero guardado = registroRepository.save(registro);
        return mapearAResponseDTO(guardado);
    }

    @Override
    public List<RegistroFinancieroResponseDTO> listarPorUsuario(String correoUsuario) {
        return registroRepository.findByUsuarioCorreo(correoUsuario).stream()
                .map(this::mapearAResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public RegistroFinancieroResponseDTO obtenerPorId(String id) {
        RegistroFinanciero registro = registroRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro financiero no encontrado con ID: " + id));
        return mapearAResponseDTO(registro);
    }

    @Override
    public void eliminar(String id, String correoUsuario) {
        RegistroFinanciero registro = registroRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro financiero no encontrado"));
        if (!registro.getUsuario().getCorreo().equalsIgnoreCase(correoUsuario)) {
            throw new RuntimeException("No tiene permisos para eliminar este registro");
        }
        registroRepository.deleteById(id);
    }

    private RegistroFinancieroResponseDTO mapearAResponseDTO(RegistroFinanciero registro) {
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
                .build();
    }
}