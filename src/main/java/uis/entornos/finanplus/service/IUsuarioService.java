package uis.entornos.finanplus.service;

import uis.entornos.finanplus.dto.UsuarioResponseDTO;
import java.util.List;

public interface IUsuarioService {
    List<UsuarioResponseDTO> listarTodos();
    UsuarioResponseDTO obtenerPorCorreo(String correo);
    UsuarioResponseDTO obtenerPorId(String id);
}