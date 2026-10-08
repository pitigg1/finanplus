package uis.entornos.finanplus.service;

import uis.entornos.finanplus.dto.RegistroFinancieroRequestDTO;
import uis.entornos.finanplus.dto.RegistroFinancieroResponseDTO;
import java.util.List;

public interface IRegistroFinancieroService {
    RegistroFinancieroResponseDTO crear(RegistroFinancieroRequestDTO request, String correoUsuario);
    List<RegistroFinancieroResponseDTO> listarPorUsuario(String correoUsuario);
    RegistroFinancieroResponseDTO obtenerPorId(String id);
    void eliminar(String id, String correoUsuario);
    RegistroFinancieroResponseDTO actualizar(String id, RegistroFinancieroRequestDTO request, String correoUsuario);
}