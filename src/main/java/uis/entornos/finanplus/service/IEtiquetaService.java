package uis.entornos.finanplus.service;

import java.util.List;

import uis.entornos.finanplus.model.Etiqueta;

public interface IEtiquetaService {
    List<Etiqueta> findAll();
    Etiqueta findById(Integer id);
    Etiqueta save(Etiqueta etiqueta);
    Etiqueta update(Integer id, Etiqueta etiqueta);
    void delete(Integer id);
}
