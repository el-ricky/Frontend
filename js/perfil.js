// perfil.js - Lógica para cargar y mostrar el perfil del usuario
document.addEventListener('DOMContentLoaded', function() {
    
    // Inicializar Feather Icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Elementos del DOM
    const loaderPerfil = document.getElementById('loaderPerfil');
    const perfilContent = document.getElementById('perfilContent');
    const alertContainer = document.getElementById('alertContainer');
    
    // Referencias a los inputs
    const inputNombreCompleto = document.getElementById('inputNombreCompleto');
    const inputEmail = document.getElementById('inputEmail');
    const inputTelefono = document.getElementById('inputTelefono');
    const inputDireccion = document.getElementById('inputDireccion');
    const nombreUsuario = document.getElementById('nombreUsuario');
    
    // Verificar si hay usuario en localStorage
    const userData = JSON.parse(localStorage.getItem('user'));
    
    if (!userData) {
        window.location.href = 'login_new.html';
        return;
    }
    
    // ── Mostrar mensaje si viene de cambios.html o new_contra.html ──
    const mensajePerfil = localStorage.getItem('mensajePerfil');
    if (mensajePerfil) {
        mostrarAlerta(mensajePerfil, 'success');
        localStorage.removeItem('mensajePerfil'); // limpiar para que no reaparezca
    }
    
    // Función para mostrar alertas
    function mostrarAlerta(mensaje, tipo = 'success') {
        if (!alertContainer) return;
        
        alertContainer.innerHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) {
                alert.classList.remove('show');
                setTimeout(() => {
                    alertContainer.innerHTML = '';
                }, 150);
            }
        }, 5000);
    }

    // Función para cargar los datos del perfil
    async function cargarPerfil() {
        try {
            const response = await fetch('https://backend-salones.vercel.app/api/cliente/info', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('user');
                    window.location.href = 'login_new.html';
                    return;
                }
                throw new Error('Error al cargar el perfil');
            }
            const perfil = await response.json();
            // Compatibilidad snake_case / camelCase
            const nombre = perfil.nombre || '';
            const apellidoPaterno = perfil.aPaterno || perfil.apellido_paterno || '';
            const apellidoMaterno = perfil.aMaterno || perfil.apellido_materno || '';
            const nombreCompleto = `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim() || 'Usuario';
            const nombreCorto = `${nombre} ${apellidoPaterno}`.trim() || 'Usuario';
            if (inputNombreCompleto) inputNombreCompleto.value = nombreCompleto;
            if (inputEmail) inputEmail.value = perfil.email || '';
            if (inputTelefono) inputTelefono.value = perfil.telefono || '';
            if (inputDireccion) inputDireccion.value = perfil.direccion || '';
            if (nombreUsuario) nombreUsuario.textContent = nombreCorto;
            loaderPerfil.style.display = 'none';
            perfilContent.style.display = 'block';
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        } catch (error) {
            console.error('Error:', error);
            loaderPerfil.style.display = 'none';
            if (perfilContent) {
                perfilContent.style.display = 'block';
                perfilContent.innerHTML = `
                    <div class="alert alert-danger text-center" role="alert">
                        <h4 class="alert-heading">Error al cargar el perfil</h4>
                        <p>No se pudo cargar la información. Por favor, intenta de nuevo.</p>
                        <hr>
                        <button class="btn btn-outline-danger" onclick="location.reload()">Reintentar</button>
                    </div>
                `;
            }
        }
    }
    cargarPerfil();
});