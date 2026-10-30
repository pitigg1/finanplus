package uis.entornos.finanplus.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.enums.Rol;
import uis.entornos.finanplus.model.Categoria;
import uis.entornos.finanplus.model.Etiqueta;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.UsuarioRepository;

/**
 * Reglas de "cada usuario ve solo lo suyo" y de roles. Todos los services usan esta clase,
 * así la regla está en un solo lugar.
 *
 * - Datos privados (registros, metas, inversiones...): solo su dueño. El administrador NO los ve:
 *   su rol sirve para gestionar cuentas, no para mirar el dinero de otros.
 * - Si alguien pide un dato ajeno se responde "no encontrado" (404) y no "prohibido" (403),
 *   para no revelar que ese dato existe.
 * - Categorías y etiquetas: cada usuario tiene las suyas. Las que no tienen dueño (datos viejos)
 *   las ven todos pero solo las cambia un administrador.
 *
 * Se usa también desde las anotaciones @PreAuthorize como @seguridad.esPropio(#id).
 */
@Component("seguridad")
@RequiredArgsConstructor
public class SeguridadService {

    private final UsuarioRepository usuarioRepository;

    private static final String NO_ENCONTRADO = "Recurso no encontrado";

    /** El usuario autenticado en esta petición. */
    public Usuario actual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Usuario usuario)) {
            throw new AccessDeniedException("Tu sesión no es válida");
        }
        return usuario;
    }

    public String idActual() {
        return actual().getIdUsuario();
    }

    /** Referencia al usuario actual para guardarla como dueño de un dato nuevo. */
    public Usuario referenciaActual() {
        return usuarioRepository.getReferenceById(idActual());
    }

    public boolean esAdmin() {
        return actual().getRol() == Rol.ADMIN;
    }

    public boolean esPropio(String idUsuario) {
        return idUsuario != null && idUsuario.equals(idActual());
    }

    /** Dato privado: solo su dueño. Si no, "no encontrado". */
    public void exigirDueno(Usuario dueno) {
        if (dueno == null || !esPropio(dueno.getIdUsuario())) {
            throw new RuntimeException(NO_ENCONTRADO);
        }
    }

    /** Para rutas como /usuario/{idUsuario}: el id de la URL tiene que ser el del usuario de la sesión. */
    public void exigirPropio(String idUsuario) {
        if (!esPropio(idUsuario)) {
            throw new RuntimeException(NO_ENCONTRADO);
        }
    }

    // ---------- Categorías y etiquetas ----------

    /** ¿La categoría es mía o general? Si es de otro usuario, "no encontrada". */
    public void exigirCategoriaVisible(Categoria categoria) {
        if (categoria.getUsuario() != null && !esPropio(categoria.getUsuario().getIdUsuario())) {
            throw new RuntimeException("Categoría no encontrada");
        }
    }

    public void exigirEtiquetaVisible(Etiqueta etiqueta) {
        if (etiqueta.getUsuario() != null && !esPropio(etiqueta.getUsuario().getIdUsuario())) {
            throw new RuntimeException("Etiqueta no encontrada");
        }
    }

    /**
     * Editar o borrar una categoría o etiqueta: su dueño o un administrador.
     * Si no tiene dueño (es general), solo un administrador.
     */
    public void exigirPuedeEditar(Usuario dueno, String que) {
        if (esAdmin()) return;
        if (dueno == null) {
            throw new AccessDeniedException("Esta " + que + " es general: solo un administrador puede cambiarla");
        }
        if (!esPropio(dueno.getIdUsuario())) {
            throw new RuntimeException(NO_ENCONTRADO);
        }
    }
}
