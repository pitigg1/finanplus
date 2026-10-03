package uis.entornos.finanplus.service;

import java.util.List;

import uis.entornos.finanplus.model.MovimientoRecurrente;

public interface IMovimientoRecurrenteService {
    List<MovimientoRecurrente> findAllByUsuario(String idUsuario);
    MovimientoRecurrente findById(String id);
    MovimientoRecurrente save(MovimientoRecurrente movimiento);
    MovimientoRecurrente update(String id, MovimientoRecurrente movimiento);
    void delete(String id);
}