package uis.entornos.finanplus.service;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.dto.ActualizarPerfilDTO;
import uis.entornos.finanplus.dto.CambiarPasswordDTO;
import uis.entornos.finanplus.dto.UsuarioResponseDTO;
import uis.entornos.finanplus.enums.Rol;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.UsuarioRepository;
import uis.entornos.finanplus.security.JwtService;
import uis.entornos.finanplus.security.SeguridadService;

/**
 * Perfil de la persona que tiene la sesión abierta (HU-17): datos personales, moneda, contraseña y foto.
 * Siempre actúa sobre el usuario del token; nunca recibe un id desde el cliente.
 */
@Service
@RequiredArgsConstructor
public class PerfilService {

    /** Monedas admitidas (código -> nombre). La moneda solo cambia cómo se muestran los montos; no convierte valores. */
    public static final Map<String, String> MONEDAS = new LinkedHashMap<>();
    static {
        MONEDAS.put("COP", "Peso colombiano");
        MONEDAS.put("USD", "Dólar estadounidense");
        MONEDAS.put("EUR", "Euro");
        MONEDAS.put("MXN", "Peso mexicano");
        MONEDAS.put("ARS", "Peso argentino");
        MONEDAS.put("CLP", "Peso chileno");
        MONEDAS.put("PEN", "Sol peruano");
        MONEDAS.put("BRL", "Real brasileño");
        MONEDAS.put("GBP", "Libra esterlina");
        MONEDAS.put("CAD", "Dólar canadiense");
    }

    private static final long MAX_BYTES = 2L * 1024 * 1024;       // 2 MB
    private static final long MAX_PIXELES = 25_000_000L;          // protege contra imágenes "bomba"
    private static final int LADO_MAXIMO = 512;

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SeguridadService seguridad;
    private final AlmacenFotos almacenFotos;

    /** Para el registro y las ediciones de un administrador: si la moneda no es válida, se usa COP. */
    public static String normalizarMoneda(String moneda) {
        if (moneda == null) return "COP";
        String codigo = moneda.trim().toUpperCase();
        return MONEDAS.containsKey(codigo) ? codigo : "COP";
    }

    private Usuario usuarioActual() {
        return usuarioRepository.findById(seguridad.idActual())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    @Transactional
    public UsuarioResponseDTO actualizar(ActualizarPerfilDTO datos) {
        String moneda = datos.getMonedaPreferida().trim().toUpperCase();
        if (!MONEDAS.containsKey(moneda)) {
            throw new RuntimeException("La moneda no es válida. Elige una de la lista.");
        }
        Usuario usuario = usuarioActual();
        usuario.setNombre(datos.getNombre().trim());
        usuario.setPais(datos.getPais() == null || datos.getPais().isBlank() ? null : datos.getPais().trim());
        usuario.setMonedaPreferida(moneda);
        return aDto(usuarioRepository.save(usuario));
    }

    /** Cambia la contraseña de la sesión actual. Devuelve un token NUEVO: los anteriores (de otros dispositivos) se cierran. */
    @Transactional
    public String cambiarPassword(CambiarPasswordDTO datos) {
        Usuario usuario = usuarioActual();
        if (!passwordEncoder.matches(datos.getActual(), usuario.getPasswordHash())) {
            throw new RuntimeException("La contraseña actual no es correcta");
        }
        if (datos.getNueva().equals(datos.getActual())) {
            throw new RuntimeException("La nueva contraseña debe ser distinta de la actual");
        }
        usuario.setPasswordHash(passwordEncoder.encode(datos.getNueva()));
        usuario.setSesionVersion(usuario.versionDeSesion() + 1);
        usuarioRepository.save(usuario);
        return jwtService.generateToken(usuario);
    }

    // ------------------------------------------------------------ foto

    @Transactional
    public UsuarioResponseDTO guardarFoto(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new RuntimeException("Elige una imagen");
        }
        if (archivo.getSize() > MAX_BYTES) {
            throw new RuntimeException("La imagen es muy grande (máximo 2 MB)");
        }
        Usuario usuario = usuarioActual();
        try {
            // se decodifica y se vuelve a guardar como JPG: así solo queda una imagen real y limpia, sin importar lo que se subió
            almacenFotos.guardar(usuario.getIdUsuario(), prepararImagen(archivo.getBytes()));
        } catch (IOException e) {
            throw new RuntimeException("No se pudo leer la imagen. Prueba con otra.");
        }
        usuario.setFotoPerfil("perfiles/" + usuario.getIdUsuario() + ".jpg");
        return aDto(usuarioRepository.save(usuario));
    }

    public byte[] leerFoto() {
        return almacenFotos.leer(seguridad.idActual())
                .orElseThrow(() -> new RuntimeException("Foto no encontrada"));
    }

    @Transactional
    public UsuarioResponseDTO borrarFoto() {
        Usuario usuario = usuarioActual();
        almacenFotos.borrar(usuario.getIdUsuario());
        usuario.setFotoPerfil(null);
        return aDto(usuarioRepository.save(usuario));
    }

    private byte[] prepararImagen(byte[] bytes) throws IOException {
        try (ImageInputStream entrada = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            Iterator<ImageReader> lectores = ImageIO.getImageReaders(entrada);
            if (!lectores.hasNext()) {
                throw new RuntimeException("El archivo no es una imagen válida. Usa JPG o PNG.");
            }
            ImageReader lector = lectores.next();
            try {
                lector.setInput(entrada);
                String formato = lector.getFormatName().toLowerCase();
                if (!formato.equals("jpeg") && !formato.equals("png")) {
                    throw new RuntimeException("Formato no admitido. Usa JPG o PNG.");
                }
                int ancho = lector.getWidth(0);
                int alto = lector.getHeight(0);
                if ((long) ancho * alto > MAX_PIXELES) {
                    throw new RuntimeException("La imagen tiene demasiados píxeles. Usa una más pequeña.");
                }
                BufferedImage original = lector.read(0);

                double escala = Math.min(1.0, (double) LADO_MAXIMO / Math.max(ancho, alto));
                int nuevoAncho = Math.max(1, (int) Math.round(ancho * escala));
                int nuevoAlto = Math.max(1, (int) Math.round(alto * escala));

                BufferedImage rgb = new BufferedImage(nuevoAncho, nuevoAlto, BufferedImage.TYPE_INT_RGB);
                Graphics2D g = rgb.createGraphics();
                g.setColor(Color.WHITE);                                  // las partes transparentes de un PNG quedan blancas
                g.fillRect(0, 0, nuevoAncho, nuevoAlto);
                g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                g.drawImage(original, 0, 0, nuevoAncho, nuevoAlto, null);
                g.dispose();

                ByteArrayOutputStream salida = new ByteArrayOutputStream();
                ImageIO.write(rgb, "jpg", salida);
                return salida.toByteArray();
            } finally {
                lector.dispose();
            }
        }
    }

    private UsuarioResponseDTO aDto(Usuario usuario) {
        return UsuarioResponseDTO.builder()
                .idUsuario(usuario.getIdUsuario())
                .nombre(usuario.getNombre())
                .correo(usuario.getCorreo())
                .monedaPreferida(usuario.getMonedaPreferida())
                .pais(usuario.getPais())
                .tieneFoto(usuario.getFotoPerfil() != null && !usuario.getFotoPerfil().isBlank())
                .estado(usuario.getEstado())
                .rol(usuario.getRol() != null ? usuario.getRol() : Rol.USUARIO)
                .fechaRegistro(usuario.getFechaRegistro())
                .build();
    }
}
