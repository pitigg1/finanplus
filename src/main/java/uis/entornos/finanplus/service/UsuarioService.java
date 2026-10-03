package uis.entornos.finanplus.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.UsuarioRepository;

@Service
@RequiredArgsConstructor
public class UsuarioService implements IUsuarioService {
	private final UsuarioRepository repository;

	@Override
	@Transactional(readOnly = true)
	public List<Usuario> findAll() {
		return repository.findAll();
	}

	@Override
	@Transactional(readOnly = true)
    public Usuario findById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
    }

	@Override
	@Transactional
    public Usuario save(Usuario usuario) {
        if(repository.existsByCorreo(usuario.getCorreo())){
            throw new RuntimeException("El correo ya está registrado");
        }
        return repository.save(usuario);
    }
	@Override
	@Transactional
    public Usuario update(String id, Usuario usuario) {
        Usuario existente = findById(id);
        existente.setNombre(usuario.getNombre());
        existente.setMonedaPreferida(usuario.getMonedaPreferida());
        existente.setPais(usuario.getPais());
        existente.setFotoPerfil(usuario.getFotoPerfil());
        existente.setEstado(usuario.getEstado());
        return repository.save(existente);
    }

	@Override
	@Transactional
    public void delete(String id) {
        repository.deleteById(id);
    }
}
