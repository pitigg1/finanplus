package uis.entornos.finanplus.service;

import java.util.List;

import uis.entornos.finanplus.model.MetaAhorro;

public interface IMetaAhorroService {
	List<MetaAhorro> findAllByUsuario(String idUsuario);
    MetaAhorro findById(String id);
    MetaAhorro save(MetaAhorro meta);
    MetaAhorro update(String id, MetaAhorro meta);
    void delete(String id);
}
