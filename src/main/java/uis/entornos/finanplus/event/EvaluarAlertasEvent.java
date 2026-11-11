package uis.entornos.finanplus.event;

/**
 * Se publica cuando cambian los movimientos de un usuario (se crea o edita un registro).
 * AlertaAutomaticaService lo escucha DESPUÉS de que la transacción se confirme y revisa
 * presupuestos, metas y balance del mes para generar las notificaciones que correspondan.
 */
public record EvaluarAlertasEvent(String correoUsuario) {
}
