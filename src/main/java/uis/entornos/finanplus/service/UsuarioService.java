package uis.entornos.finanplus.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import uis.entornos.finanplus.dto.ActualizarUsuarioDTO;
import uis.entornos.finanplus.dto.UsuarioResponseDTO;
import uis.entornos.finanplus.enums.EstadoUsuario;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.UsuarioRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService implements IUsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    // Edita un usuario. El correo no se cambia. La contraseña solo cambia si se envía una nueva.
    @Override
    public UsuarioResponseDTO actualizar(String id, ActualizarUsuarioDTO datos) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        usuario.setNombre(datos.getNombre());
        usuario.setMonedaPreferida(datos.getMonedaPreferida() == null || datos.getMonedaPreferida().isBlank()
                ? "COP" : datos.getMonedaPreferida());
        usuario.setPais(datos.getPais());
        if (datos.getEstado() != null) {
            usuario.setEstado(EstadoUsuario.valueOf(datos.getEstado()));
        }
        if (datos.getPassword() != null && !datos.getPassword().isBlank()) {
            if (datos.getPassword().length() < 6) {
                throw new RuntimeException("La contraseña debe tener al menos 6 caracteres");
            }
            // se guarda cifrada, igual que en el registro, para que el login siga funcionando
            usuario.setPasswordHash(passwordEncoder.encode(datos.getPassword()));
        }
        return mapearAResponseDTO(usuarioRepository.save(usuario));
    }

    @Override
    public List<UsuarioResponseDTO> listarTodos() {
        return usuarioRepository.findAll().stream()
                .map(this::mapearAResponseDTO)
                .collect(Collectors.toList());
    }

    // Elimina un usuario. La base de datos borra en cascada todos sus datos
    // (registros, presupuestos, metas, aportes, recurrentes, inversiones, notificaciones, métricas...)
    @Override
    public void eliminar(String id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        usuarioRepository.delete(usuario);
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