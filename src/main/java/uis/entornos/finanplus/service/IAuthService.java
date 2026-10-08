package uis.entornos.finanplus.service;

import uis.entornos.finanplus.dto.AuthResponseDTO;
import uis.entornos.finanplus.dto.LoginRequestDTO;
import uis.entornos.finanplus.dto.RegistroUsuarioDTO;

public interface IAuthService {
	AuthResponseDTO registrar(RegistroUsuarioDTO request);
    AuthResponseDTO login(LoginRequestDTO request);
}
