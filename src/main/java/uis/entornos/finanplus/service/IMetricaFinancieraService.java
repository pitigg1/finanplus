package uis.entornos.finanplus.service;

import java.util.List;

import uis.entornos.finanplus.model.MetricaFinanciera;

public interface IMetricaFinancieraService {
	List<MetricaFinanciera> findAllByUsuario(String idUsuario);
    MetricaFinanciera findById(String id);
    MetricaFinanciera save(MetricaFinanciera metrica);
    void delete(String id);
    MetricaFinanciera calcular(String idUsuario);

}
