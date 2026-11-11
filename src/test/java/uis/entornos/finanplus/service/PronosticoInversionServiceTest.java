package uis.entornos.finanplus.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;

import uis.entornos.finanplus.dto.PronosticoInversionDTO;
import uis.entornos.finanplus.dto.PronosticoInversionDTO.Escenario;
import uis.entornos.finanplus.dto.PronosticoPortafolioDTO;
import uis.entornos.finanplus.enums.NivelRiesgo;
import uis.entornos.finanplus.enums.TipoActivo;
import uis.entornos.finanplus.model.Inversion;
import uis.entornos.finanplus.repository.InversionRepository;

/** Pruebas de la fórmula del pronóstico. No necesitan base de datos ni Spring. */
class PronosticoInversionServiceTest {

    private static Inversion inversion(TipoActivo tipo, NivelRiesgo riesgo, String valor) {
        return Inversion.builder()
                .idInversion("inv-1")
                .nombreActivo("Activo de prueba")
                .tipoActivo(tipo)
                .riesgo(riesgo)
                .montoInvertido(new BigDecimal(valor))
                .valorActual(new BigDecimal(valor))
                .fechaInversion(LocalDate.of(2026, 1, 1))
                .build();
    }

    private static Inversion inversion(String id, NivelRiesgo riesgo, String valor, String rentabilidad) {
        Inversion i = inversion(TipoActivo.ACCION, riesgo, valor);
        i.setIdInversion(id);
        i.setRentabilidad(rentabilidad == null ? null : new BigDecimal(rentabilidad));
        return i;
    }

    private static Escenario escenario(PronosticoInversionDTO dto, String nombre) {
        return dto.escenarios().stream().filter(e -> e.nombre().equals(nombre)).findFirst().orElseThrow();
    }

    private static void assertCerca(String esperado, BigDecimal real) {
        assertTrue(new BigDecimal(esperado).subtract(real).abs().compareTo(new BigDecimal("0.05")) <= 0,
                "esperado " + esperado + " pero fue " + real);
    }

    @Test
    void sinRentabilidadSeUsaLaTasaPorDefecto() {
        PronosticoInversionDTO dto = PronosticoInversionService.calcular(
                inversion(TipoActivo.CDT, NivelRiesgo.BAJO, "1000000"), 12, null, null);

        assertEquals(PronosticoInversionService.ORIGEN_DEFECTO, dto.origenTasa());
        assertCerca("8.00", dto.tasaAnualEsperada());
        assertCerca("1060000.00", escenario(dto, "PESIMISTA").valorProyectado()); // 8 % - 2
        assertCerca("1080000.00", escenario(dto, "ESPERADO").valorProyectado());  // 8 %
        assertCerca("1100000.00", escenario(dto, "OPTIMISTA").valorProyectado()); // 8 % + 2
        assertCerca("8.00", escenario(dto, "ESPERADO").rentabilidadPorcentaje());
    }

    @Test
    void conRentabilidadSeUsaLaDeLaInversion() {
        PronosticoInversionDTO dto = PronosticoInversionService.calcular(
                inversion("inv-r", NivelRiesgo.BAJO, "1000000", "11"), 12, null, null);

        assertEquals(PronosticoInversionService.ORIGEN_INVERSION, dto.origenTasa());
        assertCerca("11.00", dto.tasaAnualEsperada());
        assertCerca("1110000.00", escenario(dto, "ESPERADO").valorProyectado());
    }

    @Test
    void laTasaIndicadaEnLaConsultaReemplazaALaRentabilidad() {
        PronosticoInversionDTO dto = PronosticoInversionService.calcular(
                inversion("inv-r", NivelRiesgo.BAJO, "1000000", "11"), 12, new BigDecimal("5"), null);

        assertEquals(PronosticoInversionService.ORIGEN_USUARIO, dto.origenTasa());
        assertCerca("1050000.00", escenario(dto, "ESPERADO").valorProyectado());
    }

    @Test
    void unaRentabilidadGuardadaFueraDeRangoSeTrataComoSinRentabilidad() {
        PronosticoInversionDTO dto = PronosticoInversionService.calcular(
                inversion("inv-x", NivelRiesgo.BAJO, "1000000", "5000"), 12, null, null);

        assertEquals(PronosticoInversionService.ORIGEN_DEFECTO, dto.origenTasa());
        assertCerca("1080000.00", escenario(dto, "ESPERADO").valorProyectado());
    }

    @Test
    void elPortafolioProyectaCadaInversionConSuPropiaTasa() {
        InversionRepository repo = mock(InversionRepository.class);
        when(repo.findByUsuarioCorreo("a@b.co")).thenReturn(List.of(
                inversion("con-tasa", NivelRiesgo.BAJO, "1000000", "10"),   // 10 %
                inversion("sin-tasa", NivelRiesgo.BAJO, "1000000", null))); // 8 % por defecto

        PronosticoPortafolioDTO portafolio = new PronosticoInversionService(repo).pronosticarPortafolio("a@b.co", 12);

        PronosticoInversionDTO conTasa = portafolio.inversiones().get(0);
        PronosticoInversionDTO sinTasa = portafolio.inversiones().get(1);
        assertEquals(PronosticoInversionService.ORIGEN_INVERSION, conTasa.origenTasa());
        assertEquals(PronosticoInversionService.ORIGEN_DEFECTO, sinTasa.origenTasa());
        assertCerca("1100000.00", escenario(conTasa, "ESPERADO").valorProyectado());
        assertCerca("1080000.00", escenario(sinTasa, "ESPERADO").valorProyectado());

        Escenario total = portafolio.totalPorEscenario().stream()
                .filter(e -> e.nombre().equals("ESPERADO")).findFirst().orElseThrow();
        assertCerca("2180000.00", total.valorProyectado()); // la suma de las dos, cada una con su tasa
    }

    @Test
    void conAporteMensualSeCapitalizaCadaMes() {
        PronosticoInversionDTO dto = PronosticoInversionService.calcular(
                inversion(TipoActivo.OTRO, NivelRiesgo.BAJO, "0"), 12,
                new BigDecimal("12"), new BigDecimal("100000"));

        assertEquals(PronosticoInversionService.ORIGEN_USUARIO, dto.origenTasa());
        assertCerca("1264649.79", escenario(dto, "ESPERADO").valorProyectado());
        assertCerca("64649.79", escenario(dto, "ESPERADO").gananciaProyectada());
        assertCerca("1200000.00", dto.aportesTotales());
    }

    @Test
    void conTasaCeroSoloSeSumanLosAportes() {
        PronosticoInversionDTO dto = PronosticoInversionService.calcular(
                inversion(TipoActivo.OTRO, NivelRiesgo.BAJO, "1000000"), 12,
                BigDecimal.ZERO, new BigDecimal("50000"));

        assertCerca("1600000.00", escenario(dto, "ESPERADO").valorProyectado());
        assertCerca("0.00", escenario(dto, "ESPERADO").gananciaProyectada());
    }

    @Test
    void masRiesgoSeparaMasLosEscenarios() {
        PronosticoInversionDTO dto = PronosticoInversionService.calcular(
                inversion(TipoActivo.ACCION, NivelRiesgo.ALTO, "2000000"), 24,
                new BigDecimal("12"), null);

        assertCerca("2000000.00", escenario(dto, "PESIMISTA").valorProyectado());  // 12 % - 12 = 0 %
        assertCerca("2508800.00", escenario(dto, "ESPERADO").valorProyectado());
        assertCerca("3075200.00", escenario(dto, "OPTIMISTA").valorProyectado());  // 12 % + 12 = 24 %
    }

    @Test
    void rechazaDatosInvalidos() {
        Inversion inv = inversion(TipoActivo.CDT, NivelRiesgo.BAJO, "1000");
        assertThrows(RuntimeException.class,
                () -> PronosticoInversionService.calcular(inv, 12, null, new BigDecimal("-1")));
        assertThrows(RuntimeException.class,
                () -> PronosticoInversionService.calcular(inv, 12, new BigDecimal("-100"), null));
        assertThrows(RuntimeException.class,
                () -> PronosticoInversionService.calcular(inv, 12, new BigDecimal("1001"), null));
    }
}
