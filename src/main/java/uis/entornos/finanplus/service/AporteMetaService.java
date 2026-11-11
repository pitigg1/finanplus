package uis.entornos.finanplus.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.enums.EstadoMeta;
import uis.entornos.finanplus.enums.TipoMovimiento;
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
    private final uis.entornos.finanplus.security.SeguridadService seguridad;
    private final IAlertaAutomaticaService alertaService;

    @Override
    public List<AporteMeta> findAllByMeta(String idMeta) {
        MetaAhorro meta = metaRepository.findById(idMeta)
                .orElseThrow(() -> new RuntimeException("Meta de ahorro no encontrada"));
        seguridad.exigirDueno(meta.getUsuario());
        return repository.findByMetaIdMeta(idMeta);
    }

    @Override
    public AporteMeta findById(String id) {
        AporteMeta aporte = repository.findById(id).orElseThrow(() -> new RuntimeException("Aporte no encontrado"));
        seguridad.exigirDueno(aporte.getMeta().getUsuario());
        return aporte;
    }

    @Override
    @Transactional
    public AporteMeta save(AporteMeta aporte) {
        // Cargamos la meta y el registro reales desde la BD (el JSON solo trae los IDs)
        MetaAhorro meta = metaRepository.findById(aporte.getMeta().getIdMeta())
                .orElseThrow(() -> new RuntimeException("Meta de ahorro no encontrada"));
        RegistroFinanciero registro = registroRepository.findById(aporte.getRegistro().getIdRegistro())
                .orElseThrow(() -> new RuntimeException("Registro financiero no encontrado"));

        // la meta y el registro tienen que ser del usuario de la sesión (el cliente solo manda los ids)

        seguridad.exigirDueno(meta.getUsuario());

        seguridad.exigirDueno(registro.getUsuario());

        aporte.setIdAporte(null);

        if (meta.getEstado() != EstadoMeta.ACTIVA) {
            throw new RuntimeException("Solo se puede aportar a metas activas");
        }
        // El aporte se respalda con un registro de AHORRO, usado una sola vez y por el mismo valor
        if (registro.getTipoMovimiento() != TipoMovimiento.AHORRO) {
            throw new RuntimeException("El registro de un aporte debe ser de tipo AHORRO");
        }
        if (repository.existsByRegistroIdRegistro(registro.getIdRegistro())) {
            throw new RuntimeException("Ese registro ya se usó en otro aporte");
        }
        if (aporte.getMonto().compareTo(registro.getMonto()) != 0) {
            throw new RuntimeException("El monto del aporte debe ser igual al monto de su registro");
        }

        meta.setMontoActual(meta.getMontoActual().add(aporte.getMonto()));
        actualizarEstado(meta);
        metaRepository.save(meta);
        if (meta.getEstado() == EstadoMeta.COMPLETADA) {
            alertaService.notificarMetaCumplida(meta); // la meta acaba de llegar al objetivo
        }

        aporte.setMeta(meta);
        aporte.setRegistro(registro);
        return repository.save(aporte);
    }

    @Override
    @Transactional
    public AporteMeta update(String id, AporteMeta aporte) {
        AporteMeta existente = findById(id);
        MetaAhorro meta = existente.getMeta();
        if (meta.getEstado() == EstadoMeta.CANCELADA) {
            throw new RuntimeException("No se puede modificar un aporte de una meta cancelada");
        }

        // Ajustamos la meta solo con la diferencia entre el monto nuevo y el viejo
        BigDecimal diferencia = aporte.getMonto().subtract(existente.getMonto());
        EstadoMeta estadoAntes = meta.getEstado();
        meta.setMontoActual(meta.getMontoActual().add(diferencia).max(BigDecimal.ZERO));
        actualizarEstado(meta);
        metaRepository.save(meta);
        if (estadoAntes != EstadoMeta.COMPLETADA && meta.getEstado() == EstadoMeta.COMPLETADA) {
            alertaService.notificarMetaCumplida(meta);
        }

        existente.setMonto(aporte.getMonto());
        // el registro que respalda el aporte conserva el mismo valor
        existente.getRegistro().setMonto(aporte.getMonto());
        registroRepository.save(existente.getRegistro());
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
