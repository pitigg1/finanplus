package uis.entornos.finanplus;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

import uis.entornos.finanplus.enums.EstadoUsuario;
import uis.entornos.finanplus.model.TokenRecuperacion;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.TokenRecuperacionRepository;
import uis.entornos.finanplus.repository.UsuarioRepository;
import uis.entornos.finanplus.service.MailService;

/**
 * Recuperar contraseña (HU-03). El correo se reemplaza por un "espía" para poder leer el enlace que se enviaría.
 */
@SpringBootTest
@AutoConfigureMockMvc
class RecuperacionPasswordTest {

    private static final String CLAVE = "secreto123";

    @Autowired MockMvc mvc;
    @Autowired UsuarioRepository usuarioRepository;
    @Autowired TokenRecuperacionRepository tokenRepository;
    @MockitoBean MailService mailService;

    // ------------------------------------------------------------------ ayudas

    private String correoNuevo() {
        return "r" + UUID.randomUUID() + "@prueba.com";
    }

    /** Registra una cuenta y devuelve su token de sesión. */
    private String registrar(String correo) throws Exception {
        String json = mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Persona\",\"correo\":\"" + correo + "\",\"password\":\"" + CLAVE + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.token");
    }

    private void pedirEnlace(String correo) throws Exception {
        mvc.perform(post("/api/auth/olvide-password").contentType(MediaType.APPLICATION_JSON)
                .content("{\"correo\":\"" + correo + "\"}")).andExpect(status().isOk());
    }

    /** Pide el enlace y devuelve el token que se habría enviado por correo. */
    private String tokenDelCorreo(String correo) throws Exception {
        pedirEnlace(correo);
        ArgumentCaptor<String> token = ArgumentCaptor.forClass(String.class);
        verify(mailService, times(1)).enviarRecuperacion(eq(correo), any(), token.capture(), anyInt());
        return token.getValue();
    }

    private org.springframework.test.web.servlet.ResultActions restablecer(String token, String nuevaClave) throws Exception {
        return mvc.perform(post("/api/auth/restablecer-password").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"" + token + "\",\"nuevaPassword\":\"" + nuevaClave + "\"}"));
    }

    private org.springframework.test.web.servlet.ResultActions login(String correo, String clave) throws Exception {
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"correo\":\"" + correo + "\",\"password\":\"" + clave + "\"}"));
    }

    // ------------------------------------------------------------------ pruebas

    @Test
    void flujoCompletoCambiaLaClaveYCierraLasSesionesAbiertas() throws Exception {
        String correo = correoNuevo();
        String sesionVieja = registrar(correo);
        mvc.perform(get("/api/registros").header("Authorization", "Bearer " + sesionVieja)).andExpect(status().isOk());

        String token = tokenDelCorreo(correo);
        restablecer(token, "claveNueva9").andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Listo: ya puedes iniciar sesión con tu nueva contraseña."));

        login(correo, CLAVE).andExpect(status().isUnauthorized());          // la anterior ya no sirve
        String json = login(correo, "claveNueva9").andExpect(status().isOk())   // la nueva sí
                .andReturn().getResponse().getContentAsString();
        String sesionNueva = JsonPath.read(json, "$.token");

        // la sesión abierta antes del cambio (la de quien conocía la clave vieja) se cierra
        mvc.perform(get("/api/registros").header("Authorization", "Bearer " + sesionVieja)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/registros").header("Authorization", "Bearer " + sesionNueva)).andExpect(status().isOk());
    }

    @Test
    void elEnlaceSoloSirveUnaVez() throws Exception {
        String correo = correoNuevo();
        registrar(correo);
        String token = tokenDelCorreo(correo);

        restablecer(token, "claveNueva9").andExpect(status().isOk());
        restablecer(token, "otraClave88").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El enlace no es válido o ya venció. Pide uno nuevo."));
        login(correo, "claveNueva9").andExpect(status().isOk());              // la segunda tentativa no cambió nada
    }

    @Test
    void unEnlaceInventadoNoSirve() throws Exception {
        restablecer("esto-no-es-un-enlace-real", "claveNueva9").andExpect(status().isBadRequest());
    }

    @Test
    void unEnlaceVencidoNoSirve() throws Exception {
        String correo = correoNuevo();
        registrar(correo);
        String token = tokenDelCorreo(correo);

        Usuario usuario = usuarioRepository.findByCorreo(correo).orElseThrow();
        TokenRecuperacion registro = tokenRepository.findFirstByUsuarioIdUsuarioOrderByCreadoDesc(usuario.getIdUsuario()).orElseThrow();
        registro.setExpira(LocalDateTime.now().minusMinutes(1));
        tokenRepository.save(registro);

        restablecer(token, "claveNueva9").andExpect(status().isBadRequest());
        login(correo, CLAVE).andExpect(status().isOk());                      // la clave sigue siendo la de antes
    }

    @Test
    void unCorreoQueNoExisteRecibeLaMismaRespuestaYNoSeEnviaNada() throws Exception {
        String inexistente = correoNuevo();
        String correoReal = correoNuevo();
        registrar(correoReal);

        String conCuenta = mvc.perform(post("/api/auth/olvide-password").contentType(MediaType.APPLICATION_JSON)
                .content("{\"correo\":\"" + correoReal + "\"}")).andReturn().getResponse().getContentAsString();
        var sinCuenta = mvc.perform(post("/api/auth/olvide-password").contentType(MediaType.APPLICATION_JSON)
                .content("{\"correo\":\"" + inexistente + "\"}")).andExpect(status().isOk()).andReturn();

        // misma respuesta: nadie puede averiguar qué cuentas existen
        assertEquals(conCuenta, sinCuenta.getResponse().getContentAsString());
        verify(mailService, never()).enviarRecuperacion(eq(inexistente), any(), any(), anyInt());
    }

    @Test
    void noSeEnvianCorreosSeguidosALaMismaCuenta() throws Exception {
        String correo = correoNuevo();
        registrar(correo);
        pedirEnlace(correo);
        pedirEnlace(correo);
        pedirEnlace(correo);
        verify(mailService, times(1)).enviarRecuperacion(eq(correo), any(), any(), anyInt());
    }

    @Test
    void unaContrasenaCortaSeRechazaYElEnlaceSigueValiendo() throws Exception {
        String correo = correoNuevo();
        registrar(correo);
        String token = tokenDelCorreo(correo);

        restablecer(token, "123").andExpect(status().isBadRequest());
        restablecer(token, "claveNueva9").andExpect(status().isOk());
    }

    @Test
    void unaCuentaInactivaNoRecibeEnlace() throws Exception {
        String correo = correoNuevo();
        registrar(correo);
        Usuario usuario = usuarioRepository.findByCorreo(correo).orElseThrow();
        usuario.setEstado(EstadoUsuario.INACTIVO);
        usuarioRepository.save(usuario);

        pedirEnlace(correo);
        verify(mailService, never()).enviarRecuperacion(eq(correo), any(), any(), anyInt());
    }

    @Test
    void enLaBaseDeDatosNoSeGuardaElEnlaceSinoSuHuella() throws Exception {
        String correo = correoNuevo();
        registrar(correo);
        String token = tokenDelCorreo(correo);

        Usuario usuario = usuarioRepository.findByCorreo(correo).orElseThrow();
        TokenRecuperacion guardado = tokenRepository.findFirstByUsuarioIdUsuarioOrderByCreadoDesc(usuario.getIdUsuario()).orElseThrow();
        assertNotEquals(token, guardado.getTokenHash());
        assertEquals(64, guardado.getTokenHash().length());                   // SHA-256 en hexadecimal
    }
}
