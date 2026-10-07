package uis.entornos.finanplus.service;

import java.util.List;

import uis.entornos.finanplus.model.RecomendacionIA;

public interface IRecomendacionIAService {
	List<RecomendacionIA> findAllByUsuario(String idUsuario);
	RecomendacionIA findById(String id);
	RecomendacionIA save(RecomendacionIA recomendacion);
	RecomendacionIA update(String id, RecomendacionIA recomendacion);
    void delete(String id);

}
