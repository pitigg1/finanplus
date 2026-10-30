package uis.entornos.finanplus;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import uis.entornos.finanplus.enums.TipoMovimiento;
import uis.entornos.finanplus.model.Categoria;
import uis.entornos.finanplus.repository.CategoriaRepository;

/**
 * Pruebas de "cada usuario ve solo lo suyo" y de roles. Cada prueba intenta un ataque real
 * (leer, editar o borrar datos de otra persona, subirse de rol, tomar una cuenta ajena)
 * y comprueba que falle. Usan una base H2 en memoria: no necesitan MySQL.
 */
@SpringBootTest
@AutoConfigureMockMvc
class SeguridadDatosTest {

    // Este correo está configurado como administrador en src/test/resources/application.properties
    private static final String CORREO_ADMIN = "admin@finanplus.test";
    private static final String CLAVE = "secreto123";

    @Autowired MockMvc mvc;
    @Autowired CategoriaRepository categoriaRepository;

    record Sesion(String token, String id, String correo) {}

    // ------------------------------------------------------------------ ayudas

    private Sesion registrar(String correo) throws Exception {
        String json = mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Persona\",\"correo\":\"" + correo + "\",\"password\":\"" + CLAVE + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return new Sesion(JsonPath.read(json, "$.token"), JsonPath.read(json, "$.usuario.idUsuario"), correo);
    }

    private Sesion nuevoUsuario() throws Exception {
        return registrar("u" + UUID.randomUUID() + "@prueba.com");
    }

    private Sesion admin() throws Exception {
        // el administrador es único para toda la clase de pruebas: se registra la primera vez y luego se inicia sesión
        var intento = mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Admin\",\"correo\":\"" + CORREO_ADMIN + "\",\"password\":\"" + CLAVE + "\"}")).andReturn();
        String json = intento.getResponse().getStatus() == 200
                ? intento.getResponse().getContentAsString()
                : mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"" + CORREO_ADMIN + "\",\"password\":\"" + CLAVE + "\"}"))
                        .andReturn().getResponse().getContentAsString();
        return new Sesion(JsonPath.read(json, "$.token"), JsonPath.read(json, "$.usuario.idUsuario"), CORREO_ADMIN);
    }

    private MockHttpServletRequestBuilder con(Sesion s, MockHttpServletRequestBuilder peticion, String cuerpo) {
        peticion.header("Authorization", "Bearer " + s.token());
        if (cuerpo != null) peticion.contentType(MediaType.APPLICATION_JSON).content(cuerpo);
        return peticion;
    }

    private ResultActions pedir(Sesion s, MockHttpServletRequestBuilder peticion, String cuerpo) throws Exception {
        return mvc.perform(con(s, peticion, cuerpo));
    }

    /** Crea algo y devuelve el valor del campo indicado (por ejemplo el id). */
    private String crear(Sesion s, String url, String cuerpo, String campo) throws Exception {
        String json = pedir(s, post(url), cuerpo).andExpect(status().is2xxSuccessful())
                .andReturn().getResponse().getContentAsString();
        Object valor = JsonPath.read(json, "$." + campo);
        return String.valueOf(valor);
    }

    private String categoria(Sesion s, String tipo) throws Exception {
        return crear(s, "/api/categorias", "{\"nombre\":\"Cat " + UUID.randomUUID() + "\",\"tipo\":\"" + tipo + "\"}", "idCategoria");
    }

    private String registro(Sesion s, String idCategoria, String tipo) throws Exception {
        return crear(s, "/api/registros", "{\"idCategoria\":" + idCategoria + ",\"tipoMovimiento\":\"" + tipo
                + "\",\"monto\":1000,\"fechaMovimiento\":\"2026-10-01T10:00:00\"}", "idRegistro");
    }

    // ------------------------------------------------------------------ sesión

    @Test
    void sinSesionResponde401() throws Exception {
        mvc.perform(get("/api/registros")).andExpect(status().isUnauthorized());
    }

    @Test
    void tokenInventadoResponde401() throws Exception {
        mvc.perform(get("/api/registros").header("Authorization", "Bearer esto.no.es.un.token"))
                .andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------------------ datos de otros

    @Test
    void registrosDeOtroNoSeVenNiSeTocan() throws Exception {
        Sesion a = nuevoUsuario(), b = nuevoUsuario();
        String idRegistro = registro(a, categoria(a, "GASTO"), "GASTO");

        pedir(b, get("/api/registros/" + idRegistro), null).andExpect(status().isNotFound());
        pedir(b, get("/api/registros"), null).andExpect(jsonPath("$", hasSize(0)));
        pedir(b, delete("/api/registros/" + idRegistro), null).andExpect(status().is4xxClientError());
        pedir(b, put("/api/registros/" + idRegistro), "{\"idCategoria\":1,\"tipoMovimiento\":\"GASTO\",\"monto\":1,\"fechaMovimiento\":\"2026-10-01T10:00:00\"}")
                .andExpect(status().is4xxClientError());

        // el registro de A sigue intacto
        pedir(a, get("/api/registros/" + idRegistro), null).andExpect(status().isOk()).andExpect(jsonPath("$.monto").value(1000));
    }

    @Test
    void categoriasSonPropiasDeCadaUsuario() throws Exception {
        Sesion a = nuevoUsuario(), b = nuevoUsuario();
        String idCategoria = categoria(a, "GASTO");

        pedir(a, get("/api/categorias"), null).andExpect(jsonPath("$[*].idCategoria", hasItem(Integer.parseInt(idCategoria))));
        pedir(b, get("/api/categorias"), null).andExpect(jsonPath("$[*].idCategoria", not(hasItem(Integer.parseInt(idCategoria)))));
        pedir(b, get("/api/categorias/" + idCategoria), null).andExpect(status().isNotFound());
        pedir(b, put("/api/categorias/" + idCategoria), "{\"nombre\":\"robada\",\"tipo\":\"GASTO\"}").andExpect(status().isNotFound());
        pedir(b, delete("/api/categorias/" + idCategoria), null).andExpect(status().isNotFound());

        // tampoco se puede usar la categoría de otro para crear un registro propio
        pedir(b, post("/api/registros"), "{\"idCategoria\":" + idCategoria + ",\"tipoMovimiento\":\"GASTO\",\"monto\":5,\"fechaMovimiento\":\"2026-10-01T10:00:00\"}")
                .andExpect(status().isNotFound());
    }

    @Test
    void etiquetasSonPropiasYElNombreSePuedeRepetirEntreUsuarios() throws Exception {
        Sesion a = nuevoUsuario(), b = nuevoUsuario();
        String idA = crear(a, "/api/etiquetas", "{\"nombre\":\"viaje\"}", "idEtiqueta");
        crear(b, "/api/etiquetas", "{\"nombre\":\"viaje\"}", "idEtiqueta");   // mismo nombre, otra persona: permitido

        pedir(a, get("/api/etiquetas"), null).andExpect(jsonPath("$", hasSize(1)));
        pedir(b, get("/api/etiquetas"), null).andExpect(jsonPath("$", hasSize(1)));
        pedir(b, delete("/api/etiquetas/" + idA), null).andExpect(status().isNotFound());
        // y dentro de la misma cuenta sí es único
        pedir(a, post("/api/etiquetas"), "{\"nombre\":\"viaje\"}").andExpect(status().isBadRequest());
    }

    @Test
    void inversionesDeOtroNoSeVenYElDuenoNoLoDecideElCliente() throws Exception {
        Sesion a = nuevoUsuario(), b = nuevoUsuario();
        String cuerpoA = "{\"usuario\":{\"idUsuario\":\"" + a.id() + "\"},\"nombreActivo\":\"CDT\",\"tipoActivo\":\"CDT\",\"montoInvertido\":1000,\"valorActual\":1000,\"riesgo\":\"BAJO\",\"fechaInversion\":\"2026-01-01\"}";
        String idInversion = crear(a, "/api/inversiones", cuerpoA, "idInversion");

        pedir(b, get("/api/inversiones/usuario/" + a.id()), null).andExpect(status().isNotFound());
        pedir(b, get("/api/inversiones/" + idInversion), null).andExpect(status().isNotFound());
        pedir(b, delete("/api/inversiones/" + idInversion), null).andExpect(status().isNotFound());

        // B intenta crear una inversión "a nombre de A": queda a nombre de B, no de A
        crear(b, "/api/inversiones", cuerpoA.replace("CDT\",\"tipoActivo", "Falsa\",\"tipoActivo"), "idInversion");
        pedir(b, get("/api/inversiones/usuario/" + b.id()), null).andExpect(jsonPath("$", hasSize(1)));
        pedir(a, get("/api/inversiones/usuario/" + a.id()), null).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void nadieSumaDineroALaMetaDeOtro() throws Exception {
        Sesion a = nuevoUsuario(), b = nuevoUsuario();
        String idMeta = crear(a, "/api/metas", "{\"nombre\":\"Viaje\",\"montoObjetivo\":1000000}", "idMeta");
        String idRegistroB = registro(b, categoria(b, "AHORRO"), "AHORRO");

        pedir(b, get("/api/aportes/meta/" + idMeta), null).andExpect(status().isNotFound());
        pedir(b, post("/api/aportes"), "{\"meta\":{\"idMeta\":\"" + idMeta + "\"},\"registro\":{\"idRegistro\":\"" + idRegistroB + "\"},\"monto\":500}")
                .andExpect(status().isNotFound());
        pedir(b, get("/api/metas/" + idMeta), null).andExpect(status().isNotFound());
        pedir(a, get("/api/metas/" + idMeta), null).andExpect(status().isOk()).andExpect(jsonPath("$.montoActual").value(0));
    }

    @Test
    void notificacionesRecomendacionesRecurrentesYMetricasSonPrivadas() throws Exception {
        Sesion a = nuevoUsuario(), b = nuevoUsuario();
        for (String ruta : new String[] {"notificaciones", "recomendaciones", "recurrentes", "metricas", "inversiones"}) {
            pedir(b, get("/api/" + ruta + "/usuario/" + a.id()), null).andExpect(status().isNotFound());
        }
        pedir(b, post("/api/metricas/usuario/" + a.id() + "/calcular"), null).andExpect(status().isNotFound());
        // la propia sí funciona
        pedir(b, get("/api/notificaciones/usuario/" + b.id()), null).andExpect(status().isOk());
        pedir(b, post("/api/metricas/usuario/" + b.id() + "/calcular"), null).andExpect(status().is2xxSuccessful());
    }

    @Test
    void presupuestosSoloMuestranLosDeQuienPregunta() throws Exception {
        Sesion a = nuevoUsuario(), b = nuevoUsuario();
        String idCategoria = categoria(a, "GASTO");
        String idPresupuesto = crear(a, "/api/presupuestos", "{\"idCategoria\":" + idCategoria + ",\"mes\":10,\"anio\":2026,\"limiteGasto\":1000}", "idPresupuesto");

        // aunque B pida la lista "de A", recibe solo la suya (vacía)
        pedir(b, get("/api/presupuestos/usuario/" + a.id()), null).andExpect(jsonPath("$", hasSize(0)));
        pedir(b, get("/api/presupuestos/" + idPresupuesto), null).andExpect(status().isNotFound());
        pedir(b, delete("/api/presupuestos/" + idPresupuesto), null).andExpect(status().is4xxClientError());
        pedir(a, get("/api/presupuestos/" + idPresupuesto), null).andExpect(status().isOk());
    }

    // ------------------------------------------------------------------ roles y cuentas

    @Test
    void usuarioNormalNoPuedeListarCuentas() throws Exception {
        pedir(nuevoUsuario(), get("/api/usuarios"), null)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("No tienes permiso para hacer esto"));
    }

    @Test
    void elCorreoDeAdminConfiguradoRecibeElRolAdmin() throws Exception {
        Sesion admin = admin();
        pedir(admin, get("/api/usuarios/perfil"), null).andExpect(jsonPath("$.rol").value("ADMIN"));
        pedir(admin, get("/api/usuarios"), null).andExpect(status().isOk());
    }

    @Test
    void nadieEditaNiBorraLaCuentaDeOtroYNoCambiaSuClave() throws Exception {
        Sesion a = nuevoUsuario(), b = nuevoUsuario();
        pedir(b, put("/api/usuarios/" + a.id()), "{\"nombre\":\"hackeado\",\"password\":\"claveNueva1\"}").andExpect(status().isForbidden());
        pedir(b, delete("/api/usuarios/" + a.id()), null).andExpect(status().isForbidden());
        pedir(b, get("/api/usuarios/" + a.id()), null).andExpect(status().isForbidden());

        // la clave de A sigue siendo la de antes
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"correo\":\"" + a.correo() + "\",\"password\":\"" + CLAVE + "\"}")).andExpect(status().isOk());
    }

    @Test
    void unUsuarioNoPuedePromoverseASiMismo() throws Exception {
        Sesion a = nuevoUsuario();
        pedir(a, put("/api/usuarios/" + a.id()), "{\"nombre\":\"Persona\",\"rol\":\"ADMIN\"}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.rol").value("USUARIO"));
        pedir(a, get("/api/usuarios"), null).andExpect(status().isForbidden());
    }

    @Test
    void elAdminPuedeCambiarRolesPeroNoQuitarseElSuyo() throws Exception {
        Sesion admin = admin(), b = nuevoUsuario();
        pedir(admin, put("/api/usuarios/" + b.id()), "{\"nombre\":\"Persona\",\"rol\":\"ADMIN\"}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.rol").value("ADMIN"));
        pedir(b, get("/api/usuarios"), null).andExpect(status().isOk());   // el cambio rige de inmediato

        pedir(admin, put("/api/usuarios/" + admin.id()), "{\"nombre\":\"Admin\",\"rol\":\"USUARIO\"}")
                .andExpect(status().isBadRequest());
        pedir(admin, put("/api/usuarios/" + admin.id()), "{\"nombre\":\"Admin\",\"estado\":\"INACTIVO\"}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void elAdminNoVeLosDatosPrivadosDeOtros() throws Exception {
        Sesion a = nuevoUsuario(), admin = admin();
        String idRegistro = registro(a, categoria(a, "GASTO"), "GASTO");
        pedir(admin, get("/api/registros/" + idRegistro), null).andExpect(status().isNotFound());
        pedir(admin, get("/api/inversiones/usuario/" + a.id()), null).andExpect(status().isNotFound());
    }

    @Test
    void lasCategoriasGeneralesSoloLasCambiaUnAdmin() throws Exception {
        Sesion a = nuevoUsuario(), admin = admin();
        Categoria general = categoriaRepository.save(Categoria.builder().nombre("General").tipo(TipoMovimiento.GASTO).build());
        int id = general.getIdCategoria();

        pedir(a, get("/api/categorias"), null).andExpect(jsonPath("$[*].idCategoria", hasItem(id)));   // la ven todos
        pedir(a, put("/api/categorias/" + id), "{\"nombre\":\"cambiada\",\"tipo\":\"GASTO\"}").andExpect(status().isForbidden());
        pedir(a, delete("/api/categorias/" + id), null).andExpect(status().isForbidden());
        pedir(admin, put("/api/categorias/" + id), "{\"nombre\":\"General 2\",\"tipo\":\"GASTO\"}").andExpect(status().isOk());
    }

    // ------------------------------------------------------------------ borrado y claves

    @Test
    void borrarUnUsuarioConCategoriasEnUsoFunciona() throws Exception {
        Sesion admin = admin(), b = nuevoUsuario();
        // B tiene una categoría propia que está en uso por un registro suyo y una etiqueta propia
        registro(b, categoria(b, "GASTO"), "GASTO");
        crear(b, "/api/etiquetas", "{\"nombre\":\"mia\"}", "idEtiqueta");

        pedir(admin, delete("/api/usuarios/" + b.id()), null).andExpect(status().isNoContent());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"correo\":\"" + b.correo() + "\",\"password\":\"" + CLAVE + "\"}")).andExpect(status().isUnauthorized());
    }

    @Test
    void unUsuarioPuedeBorrarSuPropiaCuenta() throws Exception {
        Sesion a = nuevoUsuario();
        registro(a, categoria(a, "GASTO"), "GASTO");
        pedir(a, delete("/api/usuarios/" + a.id()), null).andExpect(status().isNoContent());
    }

    // La clave con la que se firmaban los tokens estaba escrita en el código (y el repositorio es público).
    // Un token fabricado con ella debe ser rechazado.
    @Test
    void unTokenFabricadoConLaClaveAntiguaNoSirve() throws Exception {
        Sesion admin = admin();
        String claveAntigua = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
        String falso = io.jsonwebtoken.Jwts.builder()
                .setSubject(admin.correo())
                .setIssuedAt(new java.util.Date())
                .setExpiration(new java.util.Date(System.currentTimeMillis() + 3_600_000))
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(io.jsonwebtoken.io.Decoders.BASE64.decode(claveAntigua)),
                        io.jsonwebtoken.SignatureAlgorithm.HS256)
                .compact();

        mvc.perform(get("/api/usuarios").header("Authorization", "Bearer " + falso)).andExpect(status().isUnauthorized());
        pedir(admin, get("/api/usuarios"), null).andExpect(status().isOk());   // el token verdadero sigue funcionando
    }
}
