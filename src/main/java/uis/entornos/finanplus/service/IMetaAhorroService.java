package uis.entornos.finanplus.service;

import uis.entornos.finanplus.dto.MetaAhorroRequestDTO;
import uis.entornos.finanplus.dto.MetaAhorroResponseDTO;
import java.util.List;

public interface IMetaAhorroService {
    MetaAhorroResponseDTO crear(MetaAhorroRequestDTO request, String correoUsuario);
    List<MetaAhorroResponseDTO> listarPorUsuario(String correoUsuario);
    MetaAhorroResponseDTO obtenerPorId(String id);
    void eliminar(String id, String correoUsuario);
}