package uis.entornos.finanplus;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
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

/**
 * Reglas de negocio de punta a punta (HTTP + base H2 en memoria):
 * el tipo de un movimiento es el de su categoría, los presupuestos son solo de gasto,
 * los aportes a metas se respaldan con un registro de ahorro y el pronóstico usa la tasa de cada inversión.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ReglasNegocioTest {

    @Autowired MockMvc mvc;

    // ------------------------------------------------------------------ ayudas

    private String nuevoToken() throws Exception {
        String json = mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Persona\",\"correo\":\"r" + UUID.randomUUID() + "@prueba.com\",\"password\":\"secreto123\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.token");
    }

    private ResultActions pedir(String token, MockHttpServletRequestBuilder peticion, String cuerpo) throws Exception {
        peticion.header("Authorization", "Bearer " + token);
        if (cuerpo != null) peticion.contentType(MediaType.APPLICATION_JSON).content(cuerpo);
        return mvc.perform(peticion);
    }

    private String crear(String token, String url, String cuerpo, String campo) throws Exception {
        String json = pedir(token, post(url), cuerpo).andExpect(status().is2xxSuccessful())
                .andReturn().getResponse().getContentAsString();
        return String.valueOf((Object) JsonPath.read(json, "$." + campo));
    }

    private String categoria(String token, String nombre, String tipo) throws Exception {
        return crear(token, "/api/categorias", "{\"nombre\":\"" + nombre + "\",\"tipo\":\"" + tipo + "\"}", "idCategoria");
    }

    /** tipo == null: no se envía el campo (el backend lo toma de la categoría). */
    private String cuerpoRegistro(String idCategoria, String tipo, int monto) {
        return "{\"idCategoria\":" + idCategoria + (tipo == null ? "" : ",\"tipoMovimiento\":\"" + tipo + "\"")
                + ",\"monto\":" + monto + ",\"fechaMovimiento\":\"2026-10-01T10:00:00\"}";
    }

    // ------------------------------------------------------------------ tipo = tipo de la categoría

    @Test
    void unRegistroTomaElTipoDeSuCategoriaYNoAceptaOtro() throws Exception {
        String t = nuevoToken();
        String comida = categoria(t, "Comida", "GASTO");

        // una INVERSION en la categoría «Comida» (GASTO) se rechaza
        pedir(t, post("/api/registros"), cuerpoRegistro(comida, "INVERSION", 1000))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Comida")));
        // un tipo inexistente tampoco se convierte en GASTO a escondidas
        pedir(t, post("/api/registros"), cuerpoRegistro(comida, "XYZ", 1000)).andExpect(status().isBadRequest());

        // sin tipo o con el tipo correcto, se guarda como GASTO
        pedir(t, post("/api/registros"), cuerpoRegistro(comida, null, 1000))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.tipoMovimiento").value("GASTO"));
        String id = crear(t, "/api/registros", cuerpoRegistro(comida, "GASTO", 2000), "idRegistro");

        // al editar tampoco se puede cambiar el tipo por otro distinto al de la categoría
        pedir(t, put("/api/registros/" + id), cuerpoRegistro(comida, "INGRESO", 2000)).andExpect(status().isBadRequest());
        pedir(t, put("/api/registros/" + id), cuerpoRegistro(comida, "GASTO", 3000)).andExpect(status().isOk());
    }

    @Test
    void unRecurrenteTomaElTipoDeSuCategoria() throws Exception {
        String t = nuevoToken();
        String sueldo = categoria(t, "Sueldo", "INGRESO");
        String base = "{\"nombre\":\"Sueldo\",\"categoria\":{\"idCategoria\":" + sueldo + "},%s"
                + "\"montoEstimado\":100,\"frecuencia\":\"MENSUAL\",\"proximaFecha\":\"2099-01-01\"}";

        pedir(t, post("/api/recurrentes"), String.format(base, "\"tipoMovimiento\":\"GASTO\","))
                .andExpect(status().isBadRequest());
        pedir(t, post("/api/recurrentes"), String.format(base, ""))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.tipoMovimiento").value("INGRESO"));
    }

    @Test
    void unaCategoriaConRegistrosNoCambiaDeTipo() throws Exception {
        String t = nuevoToken();
        String conDatos = categoria(t, "Con datos", "GASTO");
        String vacia = categoria(t, "Vacia", "GASTO");
        crear(t, "/api/registros", cuerpoRegistro(conDatos, null, 1000), "idRegistro");

        pedir(t, put("/api/categorias/" + conDatos), "{\"nombre\":\"Con datos\",\"tipo\":\"INVERSION\"}")
                .andExpect(status().isBadRequest());
        pedir(t, put("/api/categorias/" + conDatos), "{\"nombre\":\"Renombrada\",\"tipo\":\"GASTO\"}")
                .andExpect(status().isOk());
        pedir(t, put("/api/categorias/" + vacia), "{\"nombre\":\"Vacia\",\"tipo\":\"INVERSION\"}")
                .andExpect(status().isOk());
    }

    // ------------------------------------------------------------------ presupuestos

    @Test
    void unPresupuestoSoloSePuedeCrearSobreUnaCategoriaDeGasto() throws Exception {
        String t = nuevoToken();
        String gasto = categoria(t, "Mercado", "GASTO");
        String ingreso = categoria(t, "Sueldo", "INGRESO");
        String cuerpo = "{\"idCategoria\":%s,\"mes\":10,\"anio\":2026,\"limiteGasto\":1000}";

        pedir(t, post("/api/presupuestos"), String.format(cuerpo, ingreso)).andExpect(status().isBadRequest());
        String id = crear(t, "/api/presupuestos", String.format(cuerpo, gasto), "idPresupuesto");
        // al editarlo tampoco se puede pasar a una categoría que no sea de gasto
        pedir(t, put("/api/presupuestos/" + id), String.format(cuerpo, ingreso)).andExpect(status().isBadRequest());
    }

    // ------------------------------------------------------------------ aportes a metas

    @Test
    void unAporteSeRespaldaConUnRegistroDeAhorroUsadoUnaSolaVezYPorElMismoValor() throws Exception {
        String t = nuevoToken();
        String ahorro = categoria(t, "Ahorro", "AHORRO");
        String gasto = categoria(t, "Gasto", "GASTO");
        String meta = crear(t, "/api/metas", "{\"nombre\":\"Viaje\",\"montoObjetivo\":1000000}", "idMeta");
        String regAhorro = crear(t, "/api/registros", cuerpoRegistro(ahorro, null, 1000), "idRegistro");
        String regAhorro2 = crear(t, "/api/registros", cuerpoRegistro(ahorro, null, 2000), "idRegistro");
        String regGasto = crear(t, "/api/registros", cuerpoRegistro(gasto, null, 1000), "idRegistro");

        String aporte = "{\"meta\":{\"idMeta\":\"" + meta + "\"},\"registro\":{\"idRegistro\":\"%s\"},\"monto\":%d}";

        pedir(t, post("/api/aportes"), String.format(aporte, regGasto, 1000)).andExpect(status().isBadRequest()); // no es AHORRO
        pedir(t, post("/api/aportes"), String.format(aporte, regAhorro2, 500)).andExpect(status().isBadRequest()); // monto distinto

        String idAporte = crear(t, "/api/aportes", String.format(aporte, regAhorro, 1000), "idAporte");
        pedir(t, post("/api/aportes"), String.format(aporte, regAhorro, 1000)).andExpect(status().isBadRequest()); // registro ya usado
        pedir(t, get("/api/metas/" + meta), null).andExpect(jsonPath("$.montoActual").value(1000));

        // al editar el aporte, el registro que lo respalda conserva el mismo valor
        pedir(t, put("/api/aportes/" + idAporte), "{\"monto\":400}").andExpect(status().isOk());
        pedir(t, get("/api/registros/" + regAhorro), null).andExpect(jsonPath("$.monto").value(400));
        pedir(t, get("/api/metas/" + meta), null).andExpect(jsonPath("$.montoActual").value(400));
    }

    // ------------------------------------------------------------------ pronóstico individual

    @Test
    void elPronosticoUsaLaRentabilidadDeCadaInversionOLaTasaPorDefecto() throws Exception {
        String t = nuevoToken();
        String cuerpo = "{\"nombreActivo\":\"%s\",\"tipoActivo\":\"CDT\",\"montoInvertido\":1000000,\"valorActual\":1000000,"
                + "%s\"riesgo\":\"BAJO\",\"fechaInversion\":\"2026-01-01\"}";
        crear(t, "/api/inversiones", String.format(cuerpo, "Con tasa", "\"rentabilidad\":10,"), "idInversion");
        String idSinTasa = crear(t, "/api/inversiones", String.format(cuerpo, "Sin tasa", ""), "idInversion");

        pedir(t, get("/api/inversiones/pronostico?meses=12"), null).andExpect(status().isOk())
                .andExpect(jsonPath("$.inversiones[*].origenTasa")
                        .value(containsInAnyOrder("RENTABILIDAD_DE_LA_INVERSION", "TASA_POR_DEFECTO")));

        pedir(t, get("/api/inversiones/" + idSinTasa + "/pronostico?meses=12"), null).andExpect(status().isOk())
                .andExpect(jsonPath("$.tasaAnualEsperada").value(8.0))
                .andExpect(jsonPath("$.escenarios[?(@.nombre=='ESPERADO')].valorProyectado").value(1080000.0));

        // una rentabilidad fuera de rango no se puede guardar
        pedir(t, post("/api/inversiones"), String.format(cuerpo, "Absurda", "\"rentabilidad\":5000,"))
                .andExpect(status().isBadRequest());
    }
}
