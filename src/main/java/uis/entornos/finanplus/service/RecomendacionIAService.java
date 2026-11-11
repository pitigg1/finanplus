package uis.entornos.finanplus.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.enums.NivelPrioridad;
import uis.entornos.finanplus.model.RecomendacionIA;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.*;

@Service
@RequiredArgsConstructor
public class RecomendacionIAService implements IRecomendacionIAService {

	private final RecomendacionIARepository recomendacionRepository;
	private final RegistroFinancieroRepository registroFinancieroRepository;
	private final MetaAhorroRepository metaAhorroRepository;
	private final AporteMetaRepository aporteMetaRepository;
	private final MovimientoRecurrenteRepository movimientoRecurrenteRepository;
	private final InversionRepository inversionRepository;
	private final PresupuestoRepository presupuestoRepository;
	private final uis.entornos.finanplus.security.SeguridadService seguridad;

	@Value("${gemini.api.key:}")
	private String geminiApiKey;

	@Value("${gemini.model:gemini-3.5-flash-lite}")
	private String modelo;

	@Override
	public List<RecomendacionIA> findAllByUsuario(String idUsuario) {
		seguridad.exigirPropio(idUsuario);
		return recomendacionRepository.findByUsuarioIdUsuario(idUsuario);
	}

	@Override
	public RecomendacionIA findById(String id) {
		RecomendacionIA recomendacion = recomendacionRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Recomendación no encontrada: " + id));
		seguridad.exigirDueno(recomendacion.getUsuario());
		return recomendacion;
	}

	@Override
	public RecomendacionIA save(RecomendacionIA recomendacion) {
		recomendacion.setIdRecomendacion(null);
		recomendacion.setUsuario(seguridad.referenciaActual());
		if (recomendacion.getFechaGeneracion() == null) {
			recomendacion.setFechaGeneracion(LocalDateTime.now());
		}
		return recomendacionRepository.save(recomendacion);
	}

	@Override
	public RecomendacionIA generarYGuardarRecomendacionGemini() {
		Usuario usuario = seguridad.referenciaActual();
		String idUsuario = usuario.getIdUsuario();

		// 1. Recopilar datos financieros
		var ultimosRegistros = registroFinancieroRepository.findByUsuarioCorreo(usuario.getCorreo()).stream()
				.sorted((a, b) -> b.getFechaMovimiento().compareTo(a.getFechaMovimiento()))
				.limit(10)
				.collect(Collectors.toList());

		var ultimasMetas = metaAhorroRepository.findByUsuarioCorreo(usuario.getCorreo()).stream()
				.limit(5)
				.collect(Collectors.toList());

		var ultimosMovimientosRecurrentes = movimientoRecurrenteRepository.findByUsuarioIdUsuario(idUsuario).stream()
				.limit(5)
				.collect(Collectors.toList());

		var ultimasInversiones = inversionRepository.findByUsuarioIdUsuario(idUsuario).stream()
				.limit(5)
				.collect(Collectors.toList());

		var ultimosPresupuestos = presupuestoRepository.findByUsuarioCorreo(usuario.getCorreo()).stream()
				.limit(5)
				.collect(Collectors.toList());

		// 2. Construir Prompt especializado para el Analista Financiero
		StringBuilder prompt = new StringBuilder();
		prompt.append("Actúa como un analista financiero experto y asesor de finanzas personales. ")
		      .append("Analiza los siguientes datos financieros del usuario y genera una recomendación financiera estructurada estrictamente en formato JSON plano (sin bloques de código markdown extra) con los siguientes campos exactos: ")
		      .append("titulo, descripcion, tipoRecomendacion, nivelPrioridad (ALTA, MEDIA, BAJA), y scoreConfianza (número entre 0 y 100).\n\n");
		
		prompt.append("--- ÚLTIMOS 10 REGISTROS FINANCIEROS ---\n");
		ultimosRegistros.forEach(r -> prompt.append(String.format("- %s: $%s (%s) - %s\n", r.getTipoMovimiento(), r.getMonto(), r.getCategoria().getNombre(), r.getDescripcion())));

		prompt.append("\n--- ÚLTIMAS 5 METAS DE AHORRO ---\n");
		ultimasMetas.forEach(m -> prompt.append(String.format("- Meta: %s, Objetivo: $%s, Actual: $%s\n", m.getNombre(), m.getMontoObjetivo(), m.getMontoActual())));

		prompt.append("\n--- ÚLTIMOS MOVIMIENTOS RECURRENTES ---\n");
		ultimosMovimientosRecurrentes.forEach(mr -> prompt.append(String.format("- %s: $%s (%s)\n", mr.getTipoMovimiento(), mr.getMontoEstimado(), mr.getFrecuencia())));

		prompt.append("\n--- ÚLTIMAS INVERSIONES ---\n");
		ultimasInversiones.forEach(inv -> prompt.append(String.format("- Inversión: $%s, Tipo: %s, Riesgo: %s\n", inv.getMontoInvertido(), inv.getTipoActivo(), inv.getRiesgo())));

		// Valores por defecto (Fallback)
		String titulo = "Optimización de Gastos y Presupuesto";
		String descripcion = "Basado en tus últimos movimientos, te sugerimos destinar un 20% adicional al fondo de ahorro y reducir gastos hormiga.";
		String tipo = "AHORRO";
		NivelPrioridad prioridad = NivelPrioridad.ALTA;
		BigDecimal confianza = new BigDecimal("92.50");

		// 3. Integración con la API de Gemini usando la URL dinámica con el modelo
		if (geminiApiKey != null && !geminiApiKey.isEmpty()) {
			try {
				RestTemplate restTemplate = new RestTemplate();
				// URL utilizando la variable 'modelo' inyectada desde application.properties (ej. gemini-3.5-flash-lite)
				String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", modelo, geminiApiKey);

				ObjectMapper mapper = new ObjectMapper();
				var partMap = java.util.Map.of("text", prompt.toString());
				var contentMap = java.util.Map.of("parts", java.util.List.of(partMap));
				var requestBodyMap = java.util.Map.of("contents", java.util.List.of(contentMap));
				
				String jsonBody = mapper.writeValueAsString(requestBodyMap);

				HttpHeaders headers = new HttpHeaders();
				headers.setContentType(MediaType.APPLICATION_JSON);
				HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

				ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

				if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
					JsonNode rootNode = mapper.readTree(response.getBody());
					String rawTextResponse = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

					// Limpiar marcadores markdown de bloque de código si los trae
					rawTextResponse = rawTextResponse.replace("```json", "").replace("```", "").trim();

					JsonNode aiData = mapper.readTree(rawTextResponse);
					
					if (aiData.has("titulo")) titulo = aiData.path("titulo").asText(titulo);
					if (aiData.has("descripcion")) descripcion = aiData.path("descripcion").asText(descripcion);
					if (aiData.has("tipoRecomendacion")) tipo = aiData.path("tipoRecomendacion").asText(tipo);
					if (aiData.has("nivelPrioridad")) {
						try {
							prioridad = NivelPrioridad.valueOf(aiData.path("nivelPrioridad").asText("ALTA").toUpperCase());
						} catch (Exception ignored) {}
					}
					if (aiData.has("scoreConfianza")) {
						confianza = new BigDecimal(aiData.path("scoreConfianza").asText("90.0"));
					}
				}
			} catch (Exception e) {
				System.err.println("Advertencia: No se pudo conectar con Gemini, usando valores de respaldo. Error: " + e.getMessage());
			}
		}

		RecomendacionIA nueva = RecomendacionIA.builder()
				.usuario(usuario)
				.titulo(titulo)
				.descripcion(descripcion)
				.tipoRecomendacion(tipo)
				.nivelPrioridad(prioridad)
				.scoreConfianza(confianza)
				.modeloUtilizado(modelo) // Guarda el string exacto del modelo configurado
				.fueAplicada(false)
				.build();

		return recomendacionRepository.save(nueva);
	}

	@Override
	public RecomendacionIA update(String id, RecomendacionIA recomendacion) {
		RecomendacionIA existente = findById(id);
		existente.setTipoRecomendacion(recomendacion.getTipoRecomendacion());
		existente.setTitulo(recomendacion.getTitulo());
		existente.setDescripcion(recomendacion.getDescripcion());
		existente.setModeloUtilizado(recomendacion.getModeloUtilizado());
		existente.setScoreConfianza(recomendacion.getScoreConfianza());
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