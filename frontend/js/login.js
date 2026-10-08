document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('formLogin');
    const formRegistro = document.getElementById('formRegistro');
    const alerta = document.getElementById('alerta');

    const API_URL = 'http://localhost:8094/api/auth';

    function mostrarAlerta(mensaje, tipo = 'danger') {
        if (!alerta) return;
        alerta.innerHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }

    // --- Guardar sesión correctamente ---
    function guardarSesion(data) {
        localStorage.setItem('jwtToken', data.token);
        localStorage.setItem('usuarioId', data.usuario.idUsuario); // CLAVE VITAL
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        window.location.href = 'index.html';
    }

    // --- Manejo de Login ---
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const correo = document.getElementById('correoLogin').value.trim();
            const password = document.getElementById('passwordLogin').value;

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    guardarSesion(data);
                } else {
                    mostrarAlerta('Credenciales incorrectas. Verifique correo y contraseña.');
                }
            } catch (error) {
                mostrarAlerta('No se pudo conectar con el servidor.');
            }
        });
    }

    // --- Manejo de Registro ---
    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('nombreRegistro').value.trim();
            const correo = document.getElementById('correoRegistro').value.trim();
            const password = document.getElementById('passwordRegistro').value;
            const monedaPreferida = document.getElementById('monedaRegistro').value.trim() || 'COP';
            const pais = document.getElementById('paisRegistro').value.trim();

            try {
                const response = await fetch(`${API_URL}/registro`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, correo, password, monedaPreferida, pais })
                });

                if (response.ok) {
                    const data = await response.json();
                    guardarSesion(data);
                } else {
                    mostrarAlerta('Error al registrar usuario. Verifique los datos introducidos.');
                }
            } catch (error) {
                mostrarAlerta('Error al conectar con el servicio de registro.');
            }
        });
    }
});