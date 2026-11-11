package uis.entornos.finanplus.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import uis.entornos.finanplus.enums.TipoMovimiento;
import uis.entornos.finanplus.model.Categoria;

/** El tipo de un registro siempre es el de su categoría. No necesita Spring ni base de datos. */
class TipoDeCategoriaTest {

    private static Categoria comida() {
        return Categoria.builder().idCategoria(1).nombre("Comida").tipo(TipoMovimiento.GASTO).build();
    }

    @Test
    void sinTipoSeTomaElDeLaCategoria() {
        assertEquals(TipoMovimiento.GASTO, TipoDeCategoria.resolver(comida(), (String) null));
        assertEquals(TipoMovimiento.GASTO, TipoDeCategoria.resolver(comida(), "  "));
    }

    @Test
    void siCoincideSeAcepta() {
        assertEquals(TipoMovimiento.GASTO, TipoDeCategoria.resolver(comida(), "gasto"));
    }

    @Test
    void unRegistroDeInversionEnUnaCategoriaDeGastoSeRechaza() {
        RuntimeException e = assertThrows(RuntimeException.class,
                () -> TipoDeCategoria.resolver(comida(), "INVERSION"));
        assertEquals(true, e.getMessage().contains("Comida"));
    }

    @Test
    void unTipoInexistenteSeRechazaYNoSeConvierteEnGasto() {
        assertThrows(RuntimeException.class, () -> TipoDeCategoria.resolver(comida(), "XYZ"));
    }
}
