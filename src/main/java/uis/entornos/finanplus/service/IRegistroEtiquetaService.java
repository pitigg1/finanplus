package uis.entornos.finanplus.service;

import java.util.List;

import uis.entornos.finanplus.model.Etiqueta;

public interface IRegistroEtiquetaService {
    List<Etiqueta> findEtiquetasByRegistro(String idRegistro);
    void asignar(String idRegistro, Integer idEtiqueta);
    void quitar(String idRegistro, Integer idEtiqueta);
}
