package uis.entornos.finanplus.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Notificacion;
import uis.entornos.finanplus.repository.NotificacionRepository;

@Service
@RequiredArgsConstructor
public class NotificacionService implements INotificacionService{
	
	private final NotificacionRepository notificacionRepository;
	
	@Override
	public List<Notificacion> findAllByUsuario(String idUsuario) {
		return notificacionRepository.findByUsuarioIdUsuario(idUsuario);
	}

	@Override
	public Notificacion findById(String id) {
		return notificacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada: " + id));
	}

	@Override
	public Notificacion save(Notificacion notificacion) {
		return notificacionRepository.save(notificacion);
	}

	@Override
	public Notificacion update(String id, Notificacion notificacion) {
		Notificacion existente = findById(id);

        // El usuario y la fecha de generación NO se modifican
        existente.setTipoAlerta(notificacion.getTipoAlerta());
        existente.setTitulo(notificacion.getTitulo());
        existente.setMensaje(notificacion.getMensaje());
        existente.setIdReferencia(notificacion.getIdReferencia());

        // Si no viene en el JSON, se conserva el valor actual
        if (notificacion.getNivelPrioridad() != null) {
            existente.setNivelPrioridad(notificacion.getNivelPrioridad());
        }

        // Mantiene coherentes "leida" y "fechaLectura"
        if (notificacion.getLeida() != null && !notificacion.getLeida().equals(existente.getLeida())) {
            existente.setLeida(notificacion.getLeida());
            existente.setFechaLectura(notificacion.getLeida() ? LocalDateTime.now() : null);
        }

        return notificacionRepository.save(existente);
	}

	@Override
	public void delete(String id) {
		notificacionRepository.delete(findById(id));	
	}

}
