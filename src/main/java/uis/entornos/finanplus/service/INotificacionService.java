package uis.entornos.finanplus.service;

import java.util.List;

import uis.entornos.finanplus.model.Notificacion;

public interface INotificacionService {
	List<Notificacion> findAllByUsuario(String idUsuario);
	Notificacion findById(String id);
	Notificacion save(Notificacion notificacion);
	Notificacion update(String id, Notificacion notificacion);
    void delete(String id);
}
