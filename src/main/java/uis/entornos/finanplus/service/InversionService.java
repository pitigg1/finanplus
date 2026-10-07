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

	 @Override
	 public List<Inversion> findAllByUsuario(String idUsuario) {
		 return inversionRepository.findByUsuarioIdUsuario(idUsuario);
	 }

	 @Override
	 public Inversion findById(String id) {
		 return inversionRepository.findById(id)
	                .orElseThrow(() -> new RuntimeException("Inversión no encontrada: " + id));
	 }

	 @Override
	 public Inversion save(Inversion inversion) {
		 return inversionRepository.save(inversion);
	 }

	 @Override
	 public Inversion update(String id, Inversion inversion) {
		 Inversion existente = findById(id);
	        existente.setNombreActivo(inversion.getNombreActivo());
	        existente.setTipoActivo(inversion.getTipoActivo());
	        existente.setMontoInvertido(inversion.getMontoInvertido());
	        existente.setValorActual(inversion.getValorActual());
	        existente.setRiesgo(inversion.getRiesgo());
	        existente.setFechaInversion(inversion.getFechaInversion());
	        return inversionRepository.save(existente);
	 }

	 @Override
	 public void delete(String id) {
		 inversionRepository.delete(findById(id));
		
	 }
	 
	 
	 

}
