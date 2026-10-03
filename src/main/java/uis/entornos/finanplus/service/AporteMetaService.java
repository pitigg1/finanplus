package uis.entornos.finanplus.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.enums.EstadoMeta;
import uis.entornos.finanplus.model.AporteMeta;
import uis.entornos.finanplus.model.MetaAhorro;
import uis.entornos.finanplus.model.RegistroFinanciero;
import uis.entornos.finanplus.repository.AporteMetaRepository;
import uis.entornos.finanplus.repository.MetaAhorroRepository;
import uis.entornos.finanplus.repository.RegistroFinancieroRepository;

@Service
@RequiredArgsConstructor
public class AporteMetaService implements IAporteMetaService {

    private final AporteMetaRepository repository;
    private final MetaAhorroRepository metaRepository;
    private final RegistroFinancieroRepository registroRepository;

    @Override
    public List<AporteMeta> findAllByMeta(String idMeta) {
        return repository.findByMetaIdMeta(idMeta);
    }

    @Override
    public AporteMeta findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Aporte no encontrado"));
    }

    @Override
    @Transactional
    public AporteMeta save(AporteMeta aporte) {
        // Cargamos la meta y el registro reales desde la BD (el JSON solo trae los IDs)
        MetaAhorro meta = metaRepository.findById(aporte.getMeta().getIdMeta())
                .orElseThrow(() -> new RuntimeException("Meta de ahorro no encontrada"));
        RegistroFinanciero registro = registroRepository.findById(aporte.getRegistro().getIdRegistro())
                .orElseThrow(() -> new RuntimeException("Registro financiero no encontrado"));

        if (meta.getEstado() != EstadoMeta.ACTIVA) {
            throw new RuntimeException("Solo se puede aportar a metas activas");
        }

        meta.setMontoActual(meta.getMontoActual().add(aporte.getMonto()));
        actualizarEstado(meta);
        metaRepository.save(meta);

        aporte.setMeta(meta);
        aporte.setRegistro(registro);
        return repository.save(aporte);
    }

    @Override
    @Transactional
    public AporteMeta update(String id, AporteMeta aporte) {
        AporteMeta existente = findById(id);
        MetaAhorro meta = existente.getMeta();

        // Ajustamos la meta solo con la diferencia entre el monto nuevo y el viejo
        BigDecimal diferencia = aporte.getMonto().subtract(existente.getMonto());
        meta.setMontoActual(meta.getMontoActual().add(diferencia).max(BigDecimal.ZERO));
        actualizarEstado(meta);
        metaRepository.save(meta);

        existente.setMonto(aporte.getMonto());
        return repository.save(existente);
    }

    @Override
    @Transactional
    public void delete(String id) {
        AporteMeta existente = findById(id);
        MetaAhorro meta = existente.getMeta();

        meta.setMontoActual(meta.getMontoActual().subtract(existente.getMonto()).max(BigDecimal.ZERO));
        actualizarEstado(meta);
        metaRepository.save(meta);

        repository.delete(existente);
    }

    private void actualizarEstado(MetaAhorro meta) {
        if (meta.getEstado() == EstadoMeta.CANCELADA) return;
        boolean cumplida = meta.getMontoActual().compareTo(meta.getMontoObjetivo()) >= 0;
        meta.setEstado(cumplida ? EstadoMeta.COMPLETADA : EstadoMeta.ACTIVA);
    }
}
