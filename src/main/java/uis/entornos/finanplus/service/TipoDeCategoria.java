package uis.entornos.finanplus.service;

import uis.entornos.finanplus.enums.TipoMovimiento;
import uis.entornos.finanplus.model.Categoria;

/**
 * Regla única: el tipo de un movimiento (registro o recurrente) es SIEMPRE el tipo de su categoría.
 * Así no puede existir, por ejemplo, un registro de INVERSION dentro de la categoría "Comida" (GASTO).
 *
 * - Si el cliente no manda tipo, se toma el de la categoría.
 * - Si lo manda y no coincide con el de la categoría, se rechaza con un mensaje claro (400).
 */
final class TipoDeCategoria {

    private TipoDeCategoria() {
    }

    /** @param tipoSolicitado texto recibido del cliente (puede ser null o vacío) */
    static TipoMovimiento resolver(Categoria categoria, String tipoSolicitado) {
        if (tipoSolicitado == null || tipoSolicitado.isBlank()) {
            return categoria.getTipo();
        }
        TipoMovimiento tipo;
        try {
            tipo = TipoMovimiento.valueOf(tipoSolicitado.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Tipo de movimiento no válido: " + tipoSolicitado
                    + " (use INGRESO, GASTO, AHORRO o INVERSION)");
        }
        return resolver(categoria, tipo);
    }

    static TipoMovimiento resolver(Categoria categoria, TipoMovimiento tipoSolicitado) {
        if (tipoSolicitado == null) {
            return categoria.getTipo();
        }
        if (tipoSolicitado != categoria.getTipo()) {
            throw new RuntimeException("El tipo del movimiento (" + tipoSolicitado
                    + ") debe ser igual al de su categoría «" + categoria.getNombre()
                    + "» (" + categoria.getTipo() + ")");
        }
        return tipoSolicitado;
    }
}
