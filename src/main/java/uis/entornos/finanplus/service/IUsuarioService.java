package uis.entornos.finanplus.service;

import java.util.List;

import uis.entornos.finanplus.model.Usuario;

public interface IUsuarioService {
	List<Usuario> findAll();
    Usuario findById(String id);
    Usuario save(Usuario usuario);
    Usuario update(String id, Usuario usuario);
    void delete(String id);
}
