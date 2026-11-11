package uis.entornos.finanplus.service;

import uis.entornos.finanplus.model.MetaAhorro;

public interface IAlertaAutomaticaService {

    /** Revisa a todos los usuarios activos. Devuelve cuántas notificaciones nuevas se crearon. */
    int evaluarTodos();

    /** Revisa a un solo usuario (presupuestos, metas próximas y balance del mes). */
    int evaluarUsuario(String correoUsuario);

    /** Avisa que una meta se completó (se llama cuando un aporte hace que llegue al objetivo). */
    void notificarMetaCumplida(MetaAhorro meta);
}
