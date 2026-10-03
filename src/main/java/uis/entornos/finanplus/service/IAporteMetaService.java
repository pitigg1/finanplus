package uis.entornos.finanplus.service;

import java.util.List;

import uis.entornos.finanplus.model.AporteMeta;

public interface IAporteMetaService {
    List<AporteMeta> findAllByMeta(String idMeta);
    AporteMeta findById(String id);
    AporteMeta save(AporteMeta aporte);
    AporteMeta update(String id, AporteMeta aporte);
    void delete(String id);
}
