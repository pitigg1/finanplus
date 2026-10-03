package uis.entornos.finanplus.service;

import java.util.List;

import uis.entornos.finanplus.model.Categoria;

public interface ICategoriaService {
    List<Categoria> findAll();
    Categoria findById(Integer id);
    Categoria save(Categoria categoria);
    Categoria update(Integer id, Categoria categoria);
    void delete(Integer id);
}