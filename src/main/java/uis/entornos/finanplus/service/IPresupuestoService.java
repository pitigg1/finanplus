package uis.entornos.finanplus.service;

import uis.entornos.finanplus.dto.PresupuestoRequestDTO;
import uis.entornos.finanplus.dto.PresupuestoResponseDTO;
import java.util.List;

public interface IPresupuestoService {
    PresupuestoResponseDTO crear(PresupuestoRequestDTO request, String correoUsuario);
    List<PresupuestoResponseDTO> listarPorUsuario(String correoUsuario);
    PresupuestoResponseDTO obtenerPorId(String id);
    void eliminar(String id, String correoUsuario);
}