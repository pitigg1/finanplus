package uis.entornos.finanplus.service;

import java.util.List;

import uis.entornos.finanplus.model.Inversion;

public interface IInversionService {
	List<Inversion> findAllByUsuario(String idUsuario);
    Inversion findById(String id);
    Inversion save(Inversion inversion);
    Inversion update(String id, Inversion inversion);
    void delete(String id);
}
