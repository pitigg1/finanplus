package uis.entornos.finanplus.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import uis.entornos.finanplus.dto.AuthResponseDTO;
import uis.entornos.finanplus.dto.LoginRequestDTO;
import uis.entornos.finanplus.dto.RegistroUsuarioDTO;
import uis.entornos.finanplus.dto.UsuarioResponseDTO;
import uis.entornos.finanplus.enums.EstadoUsuario;
import uis.entornos.finanplus.model.Usuario;
import uis.entornos.finanplus.repository.UsuarioRepository;
import uis.entornos.finanplus.security.JwtService;

@Service
@RequiredArgsConstructor
public class AuthService implements IAuthService{
	private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    public AuthResponseDTO registrar(RegistroUsuarioDTO request) {
        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setCorreo(request.getCorreo());
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setMonedaPreferida(request.getMonedaPreferida() != null ? request.getMonedaPreferida() : "COP");
        usuario.setPais(request.getPais());
        usuario.setEstado(EstadoUsuario.ACTIVO); 

        usuarioRepository.save(usuario);
        String token = jwtService.generateToken(usuario);
        return construirAuthResponse(token, usuario);
    }

    @Override
    public AuthResponseDTO login(LoginRequestDTO request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getPassword())
        );
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String token = jwtService.generateToken(usuario);
        return construirAuthResponse(token, usuario);
    }

    private AuthResponseDTO construirAuthResponse(String token, Usuario usuario) {
        UsuarioResponseDTO usuarioDTO = UsuarioResponseDTO.builder()
                .idUsuario(usuario.getIdUsuario())
                .nombre(usuario.getNombre())
                .correo(usuario.getCorreo())
                .monedaPreferida(usuario.getMonedaPreferida())
                .pais(usuario.getPais())
                .estado(usuario.getEstado())
                .fechaRegistro(usuario.getFechaRegistro())
                .build();

        return AuthResponseDTO.builder()
                .token(token)
                .usuario(usuarioDTO)
                .build();
    }
}
