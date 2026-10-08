package uis.entornos.finanplus.service;

import uis.entornos.finanplus.dto.CategoriaRequestDTO;
import uis.entornos.finanplus.dto.CategoriaResponseDTO;
import java.util.List;

public interface ICategoriaService {
    List<CategoriaResponseDTO> listarTodas();
    CategoriaResponseDTO obtenerPorId(Integer id);
    CategoriaResponseDTO crear(CategoriaRequestDTO dto);
}