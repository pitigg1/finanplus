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
    private final uis.entornos.finanplus.security.SeguridadService seguridad;
    private final uis.entornos.finanplus.repository.RegistroFinancieroRepository registroRepository;
    private final uis.entornos.finanplus.repository.CategoriaRepository categoriaRepository;
    private final uis.entornos.finanplus.repository.EtiquetaRepository etiquetaRepository;
    private final AlmacenFotos almacenFotos;

    // Edita un usuario. El correo no se cambia. La contraseña solo cambia si se envía una nueva.
    @Override
    public UsuarioResponseDTO actualizar(String id, ActualizarUsuarioDTO datos) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        usuario.setNombre(datos.getNombre());
        usuario.setMonedaPreferida(PerfilService.normalizarMoneda(datos.getMonedaPreferida()));
        usuario.setPais(datos.getPais());
        // El estado y el rol solo los cambia un administrador, y no sobre su propia cuenta (para no quedarse sin acceso).
        // Si los manda otra persona, se ignoran.
        if (seguridad.esAdmin()) {
            boolean esMiCuenta = seguridad.esPropio(usuario.getIdUsuario());
            if (datos.getEstado() != null) {
                EstadoUsuario nuevoEstado = EstadoUsuario.valueOf(datos.getEstado());
                if (esMiCuenta && nuevoEstado != EstadoUsuario.ACTIVO) {
                    throw new RuntimeException("No puedes desactivar tu propia cuenta");
                }
                usuario.setEstado(nuevoEstado);
            }
            if (datos.getRol() != null) {
                uis.entornos.finanplus.enums.Rol nuevoRol = uis.entornos.finanplus.enums.Rol.valueOf(datos.getRol());
                if (esMiCuenta && nuevoRol != uis.entornos.finanplus.enums.Rol.ADMIN) {
                    throw new RuntimeException("No puedes quitarte tu propio rol de administrador");
                }
                usuario.setRol(nuevoRol);
            }
        }
        if (datos.getPassword() != null && !datos.getPassword().isBlank()) {
            if (datos.getPassword().length() < 6) {
                throw new RuntimeException("La contraseña debe tener al menos 6 caracteres");
            }
            // se guarda cifrada, igual que en el registro, para que el login siga funcionando
            usuario.setPasswordHash(passwordEncoder.encode(datos.getPassword()));
            // si un administrador cambia la clave de otra persona, las sesiones abiertas de esa persona se cierran
            if (!seguridad.esPropio(usuario.getIdUsuario())) usuario.setSesionVersion(usuario.versionDeSesion() + 1);
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
    @org.springframework.transaction.annotation.Transactional
    public void eliminar(String id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        if (usuario.getRol() == uis.entornos.finanplus.enums.Rol.ADMIN && usuarioRepository.countByRol(uis.entornos.finanplus.enums.Rol.ADMIN) <= 1) {
            throw new RuntimeException("No se puede eliminar al único administrador");
        }
        // Orden explícito: la base de datos no deja borrar una categoría que todavía tiene registros,
        // así que primero se borran los registros del usuario (con sus aportes y etiquetas asignadas)
        // y después sus categorías y etiquetas propias. El resto de sus datos se borra en cascada.
        registroRepository.deleteAll(registroRepository.findByUsuarioCorreo(usuario.getCorreo()));
        categoriaRepository.deleteAll(categoriaRepository.findByUsuarioIdUsuario(id));
        etiquetaRepository.deleteAll(etiquetaRepository.findByUsuarioIdUsuario(id));
        usuarioRepository.delete(usuario);
        almacenFotos.borrar(id);
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
                .tieneFoto(usuario.getFotoPerfil() != null && !usuario.getFotoPerfil().isBlank())
                .estado(usuario.getEstado())
                .rol(usuario.getRol() != null ? usuario.getRol() : uis.entornos.finanplus.enums.Rol.USUARIO)
                .fechaRegistro(usuario.getFechaRegistro())
                .build();
    }
}