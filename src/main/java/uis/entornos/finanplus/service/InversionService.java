package uis.entornos.finanplus.service;

import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Inversion;
import uis.entornos.finanplus.repository.InversionRepository;

@Service
@RequiredArgsConstructor
public class InversionService implements IInversionService {

	private final InversionRepository inversionRepository;
	private final uis.entornos.finanplus.security.SeguridadService seguridad;

	@Override
	public List<Inversion> findAllByUsuario(String idUsuario) {
		seguridad.exigirPropio(idUsuario);
		return inversionRepository.findByUsuarioIdUsuario(idUsuario);
	}

	@Override
	public Inversion findById(String id) {
		Inversion inversion = inversionRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Inversión no encontrada: " + id));
		seguridad.exigirDueno(inversion.getUsuario());
		return inversion;
	}

	@Override
	public Inversion save(Inversion inversion) {
		inversion.setIdInversion(null);                       // nunca se pisa una inversión que ya existe
		inversion.setUsuario(seguridad.referenciaActual());   // el dueño es quien la crea, no lo que mande el cliente
		return inversionRepository.save(inversion);
	}

	@Override
	public Inversion update(String id, Inversion inversion) {
		Inversion existente = findById(id);
		existente.setNombreActivo(inversion.getNombreActivo());
		existente.setTipoActivo(inversion.getTipoActivo());
		existente.setMontoInvertido(inversion.getMontoInvertido());
		existente.setValorActual(inversion.getValorActual());
		existente.setRentabilidad(inversion.getRentabilidad());
		existente.setRiesgo(inversion.getRiesgo());
		existente.setFechaInversion(inversion.getFechaInversion());
		return inversionRepository.save(existente);
	}

	@Override
	public void delete(String id) {
		inversionRepository.delete(findById(id));
	}
}
