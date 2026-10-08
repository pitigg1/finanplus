package uis.entornos.finanplus.service;

import java.util.List;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import uis.entornos.finanplus.enums.NivelRiesgo;
import uis.entornos.finanplus.enums.TipoMovimiento;
import uis.entornos.finanplus.model.RegistroFinanciero;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.RegistroFinancieroRepository;
import uis.entornos.finanplus.repository.UsuarioRepository;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.MetricaFinanciera;
import uis.entornos.finanplus.repository.MetricaFinancieraRepository;

@Service
@RequiredArgsConstructor
public class MetricaFinancieraService implements IMetricaFinancieraService {
	
	private final MetricaFinancieraRepository metricaRepository;
	private final UsuarioRepository usuarioRepository;
	private final RegistroFinancieroRepository registroRepository;
	
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
	// Calcula la métrica del MES ACTUAL. Hay una sola métrica por mes: si ya existe, se actualiza.
	@Override
	public MetricaFinanciera calcular(String idUsuario) {
		Usuario usuario = usuarioRepository.findById(idUsuario)
				.orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + idUsuario));
		LocalDateTime ahora = LocalDateTime.now();

		// solo los registros de este mes y año
		List<RegistroFinanciero> registrosDelMes = registroRepository.findByUsuarioCorreo(usuario.getCorreo()).stream()
				.filter(r -> r.getFechaMovimiento() != null
						&& r.getFechaMovimiento().getYear() == ahora.getYear()
						&& r.getFechaMovimiento().getMonthValue() == ahora.getMonthValue())
				.toList();

		BigDecimal ingresos = sumar(registrosDelMes, TipoMovimiento.INGRESO);
		BigDecimal gastos = sumar(registrosDelMes, TipoMovimiento.GASTO);
		BigDecimal flujo = ingresos.subtract(gastos);

		BigDecimal tasa = null;   // % de los ingresos que queda después de los gastos
		BigDecimal score = null;  // nota de 0 a 100
		NivelRiesgo riesgo = null;

		if (ingresos.signum() > 0) {
			// tasa = (ingresos - gastos) / ingresos * 100, limitada al rango que admite DECIMAL(5,2)
			tasa = flujo.multiply(BigDecimal.valueOf(100)).divide(ingresos, 2, RoundingMode.HALF_UP)
					.max(BigDecimal.valueOf(-999.99)).min(BigDecimal.valueOf(100));
			// score: parte de 50 y sube o baja con la tasa de ahorro (ahorrar el 50% o más = 100)
			score = tasa.add(BigDecimal.valueOf(50)).max(BigDecimal.ZERO).min(BigDecimal.valueOf(100));
			riesgo = tasa.compareTo(BigDecimal.valueOf(20)) >= 0 ? NivelRiesgo.BAJO
					: tasa.signum() >= 0 ? NivelRiesgo.MEDIO
					: NivelRiesgo.ALTO;
		} else if (gastos.signum() > 0) {
			// hay gastos pero ningún ingreso: no se puede calcular la tasa y el riesgo es alto
			score = BigDecimal.ZERO;
			riesgo = NivelRiesgo.ALTO;
		}
		// sin ingresos ni gastos: no hay datos, tasa / score / riesgo quedan vacíos

		// una métrica por mes: se reutiliza la del mes si ya existe
		MetricaFinanciera metrica = metricaRepository.findByUsuarioIdUsuario(idUsuario).stream()
				.filter(m -> m.getFechaCalculo() != null
						&& m.getFechaCalculo().getYear() == ahora.getYear()
						&& m.getFechaCalculo().getMonthValue() == ahora.getMonthValue())
				.findFirst()
				.orElseGet(() -> MetricaFinanciera.builder().usuario(usuario).build());

		metrica.setFechaCalculo(ahora);
		metrica.setIngresosTotales(ingresos);
		metrica.setGastosTotales(gastos);
		metrica.setFlujoNeto(flujo);
		metrica.setTasaAhorro(tasa);
		metrica.setScoreFinanciero(score);
		metrica.setNivelRiesgo(riesgo);
		return metricaRepository.save(metrica);
	}

	private BigDecimal sumar(List<RegistroFinanciero> registros, TipoMovimiento tipo) {
		return registros.stream()
				.filter(r -> r.getTipoMovimiento() == tipo)
				.map(RegistroFinanciero::getMonto)
				.reduce(BigDecimal.ZERO, BigDecimal::add);
	}

	@Override
	public void delete(String id) {
		metricaRepository.delete(findById(id));
		
	}

}
