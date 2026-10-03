package uis.entornos.finanplus.service;

import java.util.List;

import uis.entornos.finanplus.model.Presupuesto;

public interface IPresupuestoService {
    List<Presupuesto> findAllByUsuario(String idUsuario);
    Presupuesto findById(String id);
    Presupuesto save(Presupuesto presupuesto);
    Presupuesto update(String id, Presupuesto presupuesto);
    void delete(String id);
}
