package uis.entornos.finanplus.service;

import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.MetricaFinanciera;
import uis.entornos.finanplus.repository.MetricaFinancieraRepository;

@Service
@RequiredArgsConstructor
public class MetricaFinancieraService implements IMetricaFinancieraService {
	
	private final MetricaFinancieraRepository metricaRepository;
	
	@Override
	public List<MetricaFinanciera> findAllByUsuario(String idUsuario) {
	return metricaRepository.findByUsuarioIdUsuario(idUsuario);
	}

	@Override
	public MetricaFinanciera findById(String id) {
		return metricaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Métrica no encontrada: " + id));
	}

	@Override
	public MetricaFinanciera save(MetricaFinanciera metrica) {
		return metricaRepository.save(metrica);
	}

	@Override
	public void delete(String id) {
		metricaRepository.delete(findById(id));
		
	}

}
