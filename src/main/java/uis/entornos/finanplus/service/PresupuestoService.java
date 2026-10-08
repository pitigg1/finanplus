package uis.entornos.finanplus.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import uis.entornos.finanplus.dto.PresupuestoRequestDTO;
import uis.entornos.finanplus.dto.PresupuestoResponseDTO;
import uis.entornos.finanplus.model.Categoria;
import uis.entornos.finanplus.model.Presupuesto;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.CategoriaRepository;
import uis.entornos.finanplus.repository.PresupuestoRepository;
import uis.entornos.finanplus.repository.UsuarioRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PresupuestoService implements IPresupuestoService {

    private final PresupuestoRepository presupuestoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;

    @Override
    public PresupuestoResponseDTO crear(PresupuestoRequestDTO request, String correoUsuario) {
        Usuario usuario = usuarioRepository.findByCorreo(correoUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con correo: " + correoUsuario));

        Categoria categoria = categoriaRepository.findById(request.getIdCategoria())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: " + request.getIdCategoria()));

        Presupuesto presupuesto = Presupuesto.builder()
                .usuario(usuario)
                .categoria(categoria)
                .mes(request.getMes())
                .anio(request.getAnio())
                .limiteGasto(request.getLimiteGasto())
                .gastoActual(BigDecimal.ZERO)
                .build();

        Presupuesto guardado = presupuestoRepository.save(presupuesto);
        return mapearAResponseDTO(guardado);
    }

    @Override
    public List<PresupuestoResponseDTO> listarPorUsuario(String correoUsuario) {
        return presupuestoRepository.findByUsuarioCorreo(correoUsuario).stream()
                .map(this::mapearAResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public PresupuestoResponseDTO obtenerPorId(String id) {
        Presupuesto presupuesto = presupuestoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Presupuesto no encontrado con ID: " + id));
        return mapearAResponseDTO(presupuesto);
    }

    @Override
    public void eliminar(String id, String correoUsuario) {
        Presupuesto presupuesto = presupuestoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Presupuesto no encontrado"));
        if (!presupuesto.getUsuario().getCorreo().equalsIgnoreCase(correoUsuario)) {
            throw new RuntimeException("No tiene permisos para eliminar este presupuesto");
        }
        presupuestoRepository.deleteById(id);
    }

    private PresupuestoResponseDTO mapearAResponseDTO(Presupuesto presupuesto) {
        return PresupuestoResponseDTO.builder()
                .idPresupuesto(presupuesto.getIdPresupuesto())
                .idCategoria(presupuesto.getCategoria().getIdCategoria())
                .nombreCategoria(presupuesto.getCategoria().getNombre())
                .mes(presupuesto.getMes())
                .anio(presupuesto.getAnio())
                .limiteGasto(presupuesto.getLimiteGasto())
                .gastoActual(presupuesto.getGastoActual())
                .build();
    }
}