package uis.entornos.finanplus.service;

import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.RecomendacionIA;
import uis.entornos.finanplus.repository.RecomendacionIARepository;

@Service
@RequiredArgsConstructor
public class RecomendacionIAService implements IRecomendacionIAService{
	
	private final RecomendacionIARepository recomendacionRepository;
	
	@Override
	public List<RecomendacionIA> findAllByUsuario(String idUsuario) {
		return recomendacionRepository.findByUsuarioIdUsuario(idUsuario);
	}

	@Override
	public RecomendacionIA findById(String id) {
		return recomendacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recomendación no encontrada: " + id));
	}

	@Override
	public RecomendacionIA save(RecomendacionIA recomendacion) {
		return recomendacionRepository.save(recomendacion);
	}

	@Override
	public RecomendacionIA update(String id, RecomendacionIA recomendacion) {
		RecomendacionIA existente = findById(id);

        // El usuario y la fecha de generación NO se modifican
        existente.setTipoRecomendacion(recomendacion.getTipoRecomendacion());
        existente.setTitulo(recomendacion.getTitulo());
        existente.setDescripcion(recomendacion.getDescripcion());
        existente.setModeloUtilizado(recomendacion.getModeloUtilizado());
        existente.setScoreConfianza(recomendacion.getScoreConfianza());

        // Si no vienen en el JSON, se conserva el valor actual
        if (recomendacion.getNivelPrioridad() != null) {
            existente.setNivelPrioridad(recomendacion.getNivelPrioridad());
        }
        if (recomendacion.getFueAplicada() != null) {
            existente.setFueAplicada(recomendacion.getFueAplicada());
        }

        return recomendacionRepository.save(existente);
	}

	@Override
	public void delete(String id) {
		recomendacionRepository.delete(findById(id));
		
	}

}
