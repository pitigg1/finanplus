package uis.entornos.finanplus.service;

import java.util.List;

import uis.entornos.finanplus.model.RegistroFinanciero;

public interface IRegistroFinancieroService {
	List<RegistroFinanciero> findAllByUsuario(String idUsuario);
    RegistroFinanciero findById(String id);
    RegistroFinanciero save(RegistroFinanciero registro);
    RegistroFinanciero update(String id, RegistroFinanciero registro);
    void delete(String id);
}
