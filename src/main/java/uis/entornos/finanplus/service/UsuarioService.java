package uis.entornos.finanplus.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import uis.entornos.finanplus.dto.UsuarioResponseDTO;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.UsuarioRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService implements IUsuarioService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public List<UsuarioResponseDTO> listarTodos() {
        return usuarioRepository.findAll().stream()
                .map(this::mapearAResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public UsuarioResponseDTO obtenerPorCorreo(String correo) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con correo: " + correo));
        return mapearAResponseDTO(usuario);
    }

    @Override
    public UsuarioResponseDTO obtenerPorId(String id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        return mapearAResponseDTO(usuario);
    }

    private UsuarioResponseDTO mapearAResponseDTO(Usuario usuario) {
        return UsuarioResponseDTO.builder()
                .idUsuario(usuario.getIdUsuario())
                .nombre(usuario.getNombre())
                .correo(usuario.getCorreo())
                .monedaPreferida(usuario.getMonedaPreferida())
                .pais(usuario.getPais())
                .fotoPerfil(usuario.getFotoPerfil())
                .estado(usuario.getEstado())
                .fechaRegistro(usuario.getFechaRegistro())
                .build();
    }
}