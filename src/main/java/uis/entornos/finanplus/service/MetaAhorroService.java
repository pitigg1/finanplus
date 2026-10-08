package uis.entornos.finanplus.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import uis.entornos.finanplus.dto.MetaAhorroRequestDTO;
import uis.entornos.finanplus.dto.MetaAhorroResponseDTO;
import uis.entornos.finanplus.enums.EstadoMeta;
import uis.entornos.finanplus.enums.Prioridad;
import uis.entornos.finanplus.model.MetaAhorro;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.MetaAhorroRepository;
import uis.entornos.finanplus.repository.UsuarioRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MetaAhorroService implements IMetaAhorroService {

    private final MetaAhorroRepository metaRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    public MetaAhorroResponseDTO crear(MetaAhorroRequestDTO request, String correoUsuario) {
        Usuario usuario = usuarioRepository.findByCorreo(correoUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con correo: " + correoUsuario));

        Prioridad prioridad;
        try {
            prioridad = request.getPrioridad() != null 
                    ? Prioridad.valueOf(request.getPrioridad().toUpperCase()) 
                    : Prioridad.MEDIA;
        } catch (Exception e) {
            prioridad = Prioridad.MEDIA;
        }

        MetaAhorro meta = MetaAhorro.builder()
                .usuario(usuario)
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .montoObjetivo(request.getMontoObjetivo())
                .montoActual(BigDecimal.ZERO)
                .fechaObjetivo(request.getFechaObjetivo())
                .prioridad(prioridad)
                .estado(EstadoMeta.ACTIVA)
                .build();

        MetaAhorro guardada = metaRepository.save(meta);
        return mapearAResponseDTO(guardada);
    }

    @Override
    public List<MetaAhorroResponseDTO> listarPorUsuario(String correoUsuario) {
        return metaRepository.findByUsuarioCorreo(correoUsuario).stream()
                .map(this::mapearAResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public MetaAhorroResponseDTO obtenerPorId(String id) {
        MetaAhorro meta = metaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meta de ahorro no encontrada con ID: " + id));
        return mapearAResponseDTO(meta);
    }

    @Override
    public void eliminar(String id, String correoUsuario) {
        MetaAhorro meta = metaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meta de ahorro no encontrada"));
        if (!meta.getUsuario().getCorreo().equalsIgnoreCase(correoUsuario)) {
            throw new RuntimeException("No tiene permisos para eliminar esta meta");
        }
        metaRepository.deleteById(id);
    }

    private MetaAhorroResponseDTO mapearAResponseDTO(MetaAhorro meta) {
        return MetaAhorroResponseDTO.builder()
                .idMeta(meta.getIdMeta())
                .nombre(meta.getNombre())
                .descripcion(meta.getDescripcion())
                .montoObjetivo(meta.getMontoObjetivo())
                .montoActual(meta.getMontoActual())
                .fechaObjetivo(meta.getFechaObjetivo())
                .prioridad(meta.getPrioridad() != null ? meta.getPrioridad().name() : null)
                .estado(meta.getEstado() != null ? meta.getEstado().name() : null)
                .build();
    }
}