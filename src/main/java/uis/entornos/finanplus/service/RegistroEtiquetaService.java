package uis.entornos.finanplus.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.model.Etiqueta;
import uis.entornos.finanplus.model.RegistroEtiqueta;
import uis.entornos.finanplus.model.RegistroEtiquetaId;
import uis.entornos.finanplus.model.RegistroFinanciero;
import uis.entornos.finanplus.repository.EtiquetaRepository;
import uis.entornos.finanplus.repository.RegistroEtiquetaRepository;
import uis.entornos.finanplus.repository.RegistroFinancieroRepository;

@Service
@RequiredArgsConstructor
public class RegistroEtiquetaService implements IRegistroEtiquetaService {

    private final RegistroEtiquetaRepository repository;
    private final RegistroFinancieroRepository registroRepository;
    private final EtiquetaRepository etiquetaRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Etiqueta> findEtiquetasByRegistro(String idRegistro) {
        return repository.findByIdIdRegistro(idRegistro).stream()
                .map(RegistroEtiqueta::getEtiqueta)
                .toList();
    }

    @Override
    @Transactional
    public void asignar(String idRegistro, Integer idEtiqueta) {
        RegistroEtiquetaId id = new RegistroEtiquetaId(idRegistro, idEtiqueta);
        if (repository.existsById(id)) {
            throw new RuntimeException("El registro ya tiene esa etiqueta");
        }
        RegistroFinanciero registro = registroRepository.findById(idRegistro)
                .orElseThrow(() -> new RuntimeException("Registro no encontrado"));
        Etiqueta etiqueta = etiquetaRepository.findById(idEtiqueta)
                .orElseThrow(() -> new RuntimeException("Etiqueta no encontrada"));

        repository.save(new RegistroEtiqueta(id, registro, etiqueta));
    }

    @Override
    @Transactional
    public void quitar(String idRegistro, Integer idEtiqueta) {
        repository.deleteById(new RegistroEtiquetaId(idRegistro, idEtiqueta));
    }
}
