package uis.entornos.finanplus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.jayway.jsonpath.JsonPath;

/**
 * Perfil del usuario (HU-17): datos personales, moneda, cambio de contraseña y foto.
 */
@SpringBootTest
@AutoConfigureMockMvc
class PerfilTest {

    private static final String CLAVE = "secreto123";

    @Autowired MockMvc mvc;

    record Sesion(String token, String id, String correo) {}

    // ------------------------------------------------------------------ ayudas

    private Sesion registrar(String moneda) throws Exception {
        String correo = "p" + UUID.randomUUID() + "@prueba.com";
        String json = mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Persona\",\"correo\":\"" + correo + "\",\"password\":\"" + CLAVE + "\""
                        + (moneda == null ? "" : ",\"monedaPreferida\":\"" + moneda + "\"") + "}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return new Sesion(JsonPath.read(json, "$.token"), JsonPath.read(json, "$.usuario.idUsuario"), correo);
    }

    private Sesion registrar() throws Exception {
        return registrar(null);
    }

    private ResultActions json(Sesion s, org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder peticion, String cuerpo) throws Exception {
        peticion.header("Authorization", "Bearer " + s.token());
        if (cuerpo != null) peticion.contentType(MediaType.APPLICATION_JSON).content(cuerpo);
        return mvc.perform(peticion);
    }

    private byte[] png(int ancho, int alto) throws Exception {
        BufferedImage img = new BufferedImage(ancho, alto, BufferedImage.TYPE_INT_ARGB);   // con transparencia
        for (int x = 0; x < ancho; x += 4) for (int y = 0; y < alto; y += 4) img.setRGB(x, y, 0xFF3366CC);
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        ImageIO.write(img, "png", salida);
        return salida.toByteArray();
    }

    private ResultActions subir(Sesion s, String nombre, String tipo, byte[] contenido) throws Exception {
        return mvc.perform(multipart("/api/usuarios/perfil/foto")
                .file(new MockMultipartFile("foto", nombre, tipo, contenido))
                .header("Authorization", "Bearer " + s.token()));
    }

    // ------------------------------------------------------------------ datos y moneda

    @Test
    void sePuedenCambiarLosDatosPropiosYLaMonedaSeGuardaEnMayuscula() throws Exception {
        Sesion a = registrar();
        json(a, put("/api/usuarios/perfil"), "{\"nombre\":\"  Ana Nueva  \",\"pais\":\"Colombia\",\"monedaPreferida\":\"usd\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Ana Nueva"))
                .andExpect(jsonPath("$.monedaPreferida").value("USD"));
        json(a, get("/api/usuarios/perfil"), null)
                .andExpect(jsonPath("$.nombre").value("Ana Nueva"))
                .andExpect(jsonPath("$.pais").value("Colombia"))
                .andExpect(jsonPath("$.monedaPreferida").value("USD"));
    }

    @Test
    void unaMonedaInventadaOUnNombreVacioSeRechazan() throws Exception {
        Sesion a = registrar();
        json(a, put("/api/usuarios/perfil"), "{\"nombre\":\"Ana\",\"monedaPreferida\":\"ZZZ\"}").andExpect(status().isBadRequest());
        json(a, put("/api/usuarios/perfil"), "{\"nombre\":\"Ana\",\"monedaPreferida\":\"dolares\"}").andExpect(status().isBadRequest());
        json(a, put("/api/usuarios/perfil"), "{\"nombre\":\"   \",\"monedaPreferida\":\"COP\"}").andExpect(status().isBadRequest());
        json(a, get("/api/usuarios/perfil"), null).andExpect(jsonPath("$.monedaPreferida").value("COP"));   // no cambió nada
    }

    @Test
    void alRegistrarseUnaMonedaInvalidaQuedaEnCop() throws Exception {
        Sesion a = registrar("xyz");
        json(a, get("/api/usuarios/perfil"), null).andExpect(jsonPath("$.monedaPreferida").value("COP"));
        Sesion b = registrar("eur");
        json(b, get("/api/usuarios/perfil"), null).andExpect(jsonPath("$.monedaPreferida").value("EUR"));
    }

    @Test
    void elPerfilNoPermiteCambiarElRolNiElEstado() throws Exception {
        Sesion a = registrar();
        // aunque se manden campos extra, solo cuentan nombre, país y moneda
        json(a, put("/api/usuarios/perfil"), "{\"nombre\":\"Ana\",\"monedaPreferida\":\"COP\",\"rol\":\"ADMIN\",\"estado\":\"INACTIVO\"}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.rol").value("USUARIO")).andExpect(jsonPath("$.estado").value("ACTIVO"));
    }

    // ------------------------------------------------------------------ contraseña

    @Test
    void cambiarLaContrasenaPideLaActualYCierraLasOtrasSesiones() throws Exception {
        Sesion a = registrar();

        json(a, put("/api/usuarios/perfil/password"), "{\"actual\":\"incorrecta1\",\"nueva\":\"claveNueva9\"}").andExpect(status().isBadRequest());
        json(a, put("/api/usuarios/perfil/password"), "{\"actual\":\"" + CLAVE + "\",\"nueva\":\"" + CLAVE + "\"}").andExpect(status().isBadRequest());
        json(a, put("/api/usuarios/perfil/password"), "{\"actual\":\"" + CLAVE + "\",\"nueva\":\"123\"}").andExpect(status().isBadRequest());

        String respuesta = json(a, put("/api/usuarios/perfil/password"), "{\"actual\":\"" + CLAVE + "\",\"nueva\":\"claveNueva9\"}")
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String tokenNuevo = JsonPath.read(respuesta, "$.token");

        // la sesión de antes (otro dispositivo) se cierra; la nueva, que devolvió el cambio, sigue
        mvc.perform(get("/api/usuarios/perfil").header("Authorization", "Bearer " + a.token())).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/usuarios/perfil").header("Authorization", "Bearer " + tokenNuevo)).andExpect(status().isOk());

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"correo\":\"" + a.correo() + "\",\"password\":\"" + CLAVE + "\"}")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"correo\":\"" + a.correo() + "\",\"password\":\"claveNueva9\"}")).andExpect(status().isOk());
    }

    // ------------------------------------------------------------------ foto

    @Test
    void sePuedeSubirUnaFotoYSeReduceAUnJpgPequeno() throws Exception {
        Sesion a = registrar();
        json(a, get("/api/usuarios/perfil"), null).andExpect(jsonPath("$.tieneFoto").value(false));
        json(a, get("/api/usuarios/perfil/foto"), null).andExpect(status().isNotFound());

        subir(a, "mi-foto.png", "image/png", png(1600, 900)).andExpect(status().isOk()).andExpect(jsonPath("$.tieneFoto").value(true));

        byte[] bytes = json(a, get("/api/usuarios/perfil/foto"), null)
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentType(MediaType.IMAGE_JPEG))
                .andReturn().getResponse().getContentAsByteArray();
        BufferedImage devuelta = ImageIO.read(new ByteArrayInputStream(bytes));
        assertNotNull(devuelta, "lo que devuelve debe ser una imagen real");
        assertTrue(Math.max(devuelta.getWidth(), devuelta.getHeight()) <= 512, "la foto se reduce a 512 px como máximo");
        assertEquals(512, devuelta.getWidth());                                                 // 1600x900 -> 512x288
    }

    @Test
    void unArchivoQueNoEsUnaImagenSeRechazaAunqueDigaQueLoEs() throws Exception {
        Sesion a = registrar();
        byte[] texto = "<script>alert('hola')</script>".getBytes();
        subir(a, "foto.png", "image/png", texto).andExpect(status().isBadRequest());
        subir(a, "foto.jpg", "image/jpeg", new byte[0]).andExpect(status().isBadRequest());
        json(a, get("/api/usuarios/perfil"), null).andExpect(jsonPath("$.tieneFoto").value(false));
    }

    @Test
    void unaImagenMuyGrandeOConDemasiadosPixelesSeRechaza() throws Exception {
        Sesion a = registrar();
        subir(a, "grande.png", "image/png", new byte[3 * 1024 * 1024]).andExpect(status().isBadRequest());   // más de 2 MB
        subir(a, "enorme.png", "image/png", png(6000, 5000)).andExpect(status().isBadRequest());              // 30 millones de píxeles
    }

    @Test
    void cadaPersonaSoloVeSuPropiaFotoYSePuedeQuitar() throws Exception {
        Sesion a = registrar(), b = registrar();
        subir(a, "a.png", "image/png", png(300, 300)).andExpect(status().isOk());

        json(b, get("/api/usuarios/perfil/foto"), null).andExpect(status().isNotFound());    // B no ve la de A
        json(a, get("/api/usuarios/perfil/foto"), null).andExpect(status().isOk());

        json(a, delete("/api/usuarios/perfil/foto"), null).andExpect(status().isOk()).andExpect(jsonPath("$.tieneFoto").value(false));
        json(a, get("/api/usuarios/perfil/foto"), null).andExpect(status().isNotFound());
    }

    @Test
    void sinSesionNoSePuedeUsarElPerfil() throws Exception {
        mvc.perform(get("/api/usuarios/perfil/foto")).andExpect(status().isUnauthorized());
        mvc.perform(multipart("/api/usuarios/perfil/foto").file(new MockMultipartFile("foto", "a.png", "image/png", png(50, 50))))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/api/usuarios/perfil").contentType(MediaType.APPLICATION_JSON).content("{\"nombre\":\"x\",\"monedaPreferida\":\"COP\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void alBorrarLaCuentaSeBorraTambienLaFoto() throws Exception {
        Sesion a = registrar();
        subir(a, "a.png", "image/png", png(100, 100)).andExpect(status().isOk());
        Path archivo = Paths.get("target/uploads-pruebas/perfiles/" + a.id() + ".jpg").toAbsolutePath();
        assertTrue(Files.exists(archivo), "la foto debería existir en disco");

        json(a, delete("/api/usuarios/" + a.id()), null).andExpect(status().isNoContent());
        assertFalse(Files.exists(archivo), "la foto debe borrarse junto con la cuenta");
    }
}
